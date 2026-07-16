import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { DecorSVG, FishSVG, type DecorKind, type Species } from './art';
import { Caustics } from './Caustics';
import { DISCOVERY_SPECIES, discoveriesFor } from './collectibles';
import {
  createFish,
  depthOf,
  investigate,
  paintFish,
  plantMotion,
  step,
  type Flake,
  type SimEnv,
  type SimFish,
} from './sim';

/**
 * `bloom` mode. An aquarium designer where the tank is alive: decorations stay
 * exactly where you put them, but the fish you add start swimming. Drop a castle
 * and someone goes to look at it. Combine decorations and a new species makes an
 * entrance. Nothing is ever wrong; anything can be dragged back out.
 */

interface Item {
  id: string;
  kind: string; // 'fish:clownfish' | 'decor:castle'
  fx: number;
  fy: number;
}
interface Save {
  water: string;
  gravel: string;
  bg: string;
  items: Item[];
  discovered: string[];
}

const WATERS = ['#7FC6E6', '#8FD0C0', '#A9C9F0', '#9AD9CE'];
const GRAVELS = ['#E7CE8F', '#D9B88C', '#E7B7CE', '#C9B4DE'];
const BGS = ['#EAF6FF', '#F4EAFB', '#EAF9F0', '#FFF0F5'];

const TRAY_FISH: Species[] = ['clownfish', 'tang', 'sunny'];
const TRAY_DECOR: DecorKind[] = ['plant', 'rock', 'castle', 'chest'];

const DEFAULT_SAVE: Save = { water: WATERS[0], gravel: GRAVELS[0], bg: BGS[0], items: [], discovered: [] };

const SIZE: Record<string, number> = {
  'fish:clownfish': 92, 'fish:tang': 92, 'fish:sunny': 92, 'fish:angelfish': 96,
  'fish:seahorse': 80, 'fish:jelly': 88, 'fish:goldie': 92,
  'decor:plant': 96, 'decor:rock': 84, 'decor:castle': 104, 'decor:chest': 92,
};

function decorArt(kind: string, size: number) {
  return kind.startsWith('fish:') ? (
    <FishSVG species={kind.slice(5) as Species} size={size} />
  ) : (
    <DecorSVG kind={kind.slice(6) as DecorKind} size={size} />
  );
}

interface Drag {
  kind: string;
  x: number;
  y: number;
  existingId?: string;
}

/** Module scope on purpose: declared inside the component it would be a new
 *  component type every render, remounting its whole subtree each time. */
function Swatches({ list, value, onPick }: { list: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {list.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className={`h-8 w-8 rounded-full shadow-sm ${value === c ? 'ring-4 ring-white' : ''}`}
          style={{ background: c }}
          aria-label="color"
        />
      ))}
    </div>
  );
}

export function BloomDesigner({ save, award, sound, theme, reduceMotion }: GameProps) {
  const [state, setState] = useState<Save>(DEFAULT_SAVE);
  const [ghost, setGhost] = useState<Drag | null>(null);
  const [landing, setLanding] = useState<string[]>([]);
  const [dust, setDust] = useState<{ id: number; x: number; y: number }[]>([]);
  const [pour, setPour] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; s: number }[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [flakeIds, setFlakeIds] = useState<number[]>([]);
  const [tick, setTick] = useState(0); // re-render when fish are added/removed

  const dragRef = useRef<Drag | null>(null);
  const tankRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const fish = useRef<SimFish[]>([]);
  const fishEls = useRef(new Map<string, HTMLDivElement | null>());
  const plantEls = useRef(new Map<string, HTMLDivElement | null>());
  const flakeEls = useRef(new Map<number, HTMLDivElement | null>());
  const holdSince = useRef(0);
  const lastFeed = useRef(0);
  const nextId = useRef(1);
  const melody = useRef({ step: 0, at: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Plant items, recomputed only when the tank changes — not every frame. */
  const plantItems = useRef<Item[]>([]);

  const env = useRef<SimEnv>({
    w: 0, h: 0, attractor: null, flakes: [], plants: [], timeScale: 1, reduceMotion,
  });
  env.current.reduceMotion = reduceMotion;

  /** Consecutive placements walk up a pentatonic scale, then reset. */
  function nextNote(): number {
    const now = performance.now();
    melody.current.step = now - melody.current.at > 1400 ? 0 : melody.current.step + 1;
    melody.current.at = now;
    return melody.current.step % 8;
  }

  useEffect(() => {
    void save.load<Save>().then((d) => {
      if (d) setState({ ...DEFAULT_SAVE, ...d });
    });
  }, [save]);

  function commit(next: Save) {
    setState(next);
    save.put(next);
  }

  // Keep the simulation's cast in step with what's actually in the tank.
  useEffect(() => {
    const el = tankRef.current;
    const w = el?.clientWidth || env.current.w || 800;
    const h = el?.clientHeight || env.current.h || 400;
    const fishItems = state.items.filter((i) => i.kind.startsWith('fish:'));
    const keys = new Set(fishItems.map((i) => i.id));
    fish.current = fish.current.filter((f) => keys.has(f.key));
    for (const it of fishItems) {
      const existing = fish.current.find((f) => f.key === it.id);
      if (existing) {
        existing.homeY = it.fy * h;
      } else {
        fish.current.push(
          createFish({
            key: it.id,
            species: it.kind.slice(5) as Species,
            x: it.fx * w,
            y: it.fy * h,
            size: SIZE[it.kind] ?? 92,
          }),
        );
      }
    }
    plantItems.current = state.items.filter((i) => i.kind === 'decor:plant');
    env.current.plants = plantItems.current.map((i) => ({ x: i.fx * w, y: i.fy * h }));
    setTick((t) => t + 1);
  }, [state.items]);

  const dropFlake = (id: number) => {
    const i = env.current.flakes.findIndex((f) => f.id === id);
    if (i >= 0) env.current.flakes.splice(i, 1);
    flakeEls.current.delete(id);
    setFlakeIds((ids) => ids.filter((x) => x !== id));
  };
  env.current.onEat = (f) => {
    dropFlake(f.id);
    sound.pop();
  };

  // The heartbeat.
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const el = tankRef.current;
      if (el) {
        const e = env.current;
        e.w = el.clientWidth;
        e.h = el.clientHeight;

        if (e.attractor && now - holdSince.current > 900 && now - lastFeed.current > 260) {
          lastFeed.current = now;
          const made: Flake[] = [];
          for (let i = 0; i < 3; i++) {
            made.push({
              id: nextId.current++,
              x: e.attractor.x + (Math.random() * 60 - 30),
              y: e.attractor.y + (Math.random() * 20 - 10),
              vy: 14 + Math.random() * 16,
            });
          }
          e.flakes.push(...made);
          setFlakeIds((ids) => [...ids, ...made.map((f) => f.id)]);
        }

        // Backwards, so a flake can be removed without copying the array.
        for (let i = e.flakes.length - 1; i >= 0; i--) {
          const f = e.flakes[i];
          f.y += f.vy * dt;
          f.x += Math.sin(now / 700 + f.id) * 6 * dt;
          if (f.y > e.h - 60) {
            dropFlake(f.id);
            continue;
          }
          const node = flakeEls.current.get(f.id);
          if (node) node.style.transform = `translate(${f.x}px, ${f.y}px) translate(-50%, -50%)`;
        }

        for (const f of fish.current) {
          step(f, e, dt, now);
          const node = fishEls.current.get(f.key);
          if (node) paintFish(node, f, e);
        }

        for (const p of plantItems.current) {
          const node = plantEls.current.get(p.id);
          if (!node) continue;
          const { sway, bend } = plantMotion(p.fx * e.w, p.fy * e.h, fish.current, now, e.reduceMotion);
          node.style.transform = `skewX(${bend}deg) rotate(${sway}deg)`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function inside(ref: React.RefObject<HTMLElement>, x: number, y: number): DOMRect | null {
    const r = ref.current?.getBoundingClientRect();
    if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return r;
    return null;
  }

  /** A new species has been coaxed into the tank. Everything hushes, and it swims in. */
  function makeEntrance(id: string, next: Save): Save {
    const species = DISCOVERY_SPECIES[id];
    const e = env.current;
    const toX = e.w * (0.3 + Math.random() * 0.4);
    const toY = e.h * (0.28 + Math.random() * 0.34);
    const itemId = crypto.randomUUID();
    fish.current.push(
      createFish({
        key: itemId,
        species,
        x: Math.random() < 0.5 ? -140 : e.w + 140,
        y: toY,
        size: SIZE[`fish:${species}`] ?? 92,
        temperament: 'curious',
        entering: true,
        enterTo: { x: toX, y: toY },
      }),
    );
    e.timeScale = 0.28;
    window.setTimeout(() => {
      env.current.timeScale = 1;
    }, 950);
    award(id);
    return {
      ...next,
      discovered: [...next.discovered, id],
      items: [...next.items, { id: itemId, kind: `fish:${species}`, fx: toX / Math.max(1, e.w), fy: toY / Math.max(1, e.h) }],
    };
  }

  function runDiscovery(next: Save): Save {
    let result = next;
    for (const id of discoveriesFor(next.items.map((i) => i.kind))) {
      if (result.discovered.includes(id)) continue;
      result = makeEntrance(id, result);
    }
    return result;
  }

  function finish(x: number, y: number) {
    const d = dragRef.current;
    dragRef.current = null;
    setGhost(null);
    if (!d) return;
    const s = stateRef.current;

    if (d.existingId && inside(trashRef, x, y)) {
      commit({ ...s, items: s.items.filter((i) => i.id !== d.existingId) });
      sound.pop();
      return;
    }
    const tank = inside(tankRef, x, y);
    if (!tank) return; // dropped in the void — nothing lost, nothing changed
    const fx = Math.min(0.96, Math.max(0.04, (x - tank.left) / tank.width));
    const fy = Math.min(0.94, Math.max(0.06, (y - tank.top) / tank.height));

    if (d.existingId) {
      commit({ ...s, items: s.items.map((i) => (i.id === d.existingId ? { ...i, fx, fy } : i)) });
      const f = fish.current.find((x2) => x2.key === d.existingId);
      if (f) {
        f.x = fx * env.current.w;
        f.y = fy * env.current.h;
        f.baseY = f.y;
        f.homeY = f.y;
      }
      sound.blip(nextNote());
      return;
    }

    const id = crypto.randomUUID();
    const withItem: Save = { ...s, items: [...s.items, { id, kind: d.kind, fx, fy }] };
    commit(runDiscovery(withItem));
    sound.blip(nextNote());

    // It lands, kicks up a little gravel, and the curious come to look.
    setLanding((l) => [...l, id]);
    window.setTimeout(() => setLanding((l) => l.filter((z) => z !== id)), 560);
    const px = fx * env.current.w;
    const py = fy * env.current.h;
    const puffs = [0, 1, 2].map((i) => ({ id: nextId.current++, x: px + (i - 1) * 22, y: py + 26 }));
    setDust((p) => [...p, ...puffs]);
    if (!d.kind.startsWith('fish:')) investigate(fish.current, px, py, performance.now());
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragRef.current) {
        dragRef.current = { ...dragRef.current, x: e.clientX, y: e.clientY };
        setGhost(dragRef.current);
        return;
      }
      if (env.current.attractor) {
        const r = tankRef.current?.getBoundingClientRect();
        if (r) env.current.attractor = { x: e.clientX - r.left, y: e.clientY - r.top };
      }
    };
    const up = (e: PointerEvent) => {
      if (dragRef.current) finish(e.clientX, e.clientY);
      env.current.attractor = null;
      holdSince.current = 0;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  function startNew(kind: string, e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = { kind, x: e.clientX, y: e.clientY };
    setGhost(dragRef.current);
  }
  function startExisting(item: Item, e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { kind: item.kind, x: e.clientX, y: e.clientY, existingId: item.id };
    setGhost(dragRef.current);
  }

  /** Touching open water: bubbles, ripples, and the fish come to see. */
  function waterDown(e: React.PointerEvent) {
    const r = tankRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    env.current.attractor = { x, y };
    holdSince.current = now;
    setBubbles((b) => [...b, { id: nextId.current++, x, y, s: 12 + Math.random() * 16 }]);
    if (y < env.current.h * 0.14) {
      setRipples((rr) => [...rr, { id: nextId.current++, x, y }]);
      sound.splash();
    } else {
      sound.blip();
    }
  }

  function setWater(c: string) {
    if (c === state.water || pour) return;
    sound.splash();
    if (reduceMotion) {
      commit({ ...state, water: c });
      return;
    }
    setPour(c);
  }

  // Safety net: the pour normally commits on animationend, but if that never
  // arrives (tab hidden mid-pour) the color must still land — otherwise `pour`
  // stays set and blocks every future water change.
  useEffect(() => {
    if (!pour) return;
    const t = window.setTimeout(() => {
      commit({ ...stateRef.current, water: pour });
      setPour(null);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [pour]);

  const decorItems = state.items.filter((i) => !i.kind.startsWith('fish:'));

  return (
    <div className="flex h-screen w-screen flex-col transition-colors duration-500" style={{ background: state.bg }}>
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <Swatches list={WATERS} value={pour ?? state.water} onPick={setWater} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🪨</span>
          <Swatches list={GRAVELS} value={state.gravel} onPick={(c) => { commit({ ...state, gravel: c }); sound.blip(); }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <Swatches list={BGS} value={state.bg} onPick={(c) => { commit({ ...state, bg: c }); sound.blip(); }} />
        </div>
      </div>

      <div className="relative flex-1 px-4 pb-2">
        <div
          ref={tankRef}
          onPointerDown={waterDown}
          className="relative h-full w-full touch-none overflow-hidden rounded-cozy shadow-inner"
          style={{ background: state.water }}
        >
          {/* the new water pours down over the old */}
          {pour && (
            <div
              className="cc-pour absolute inset-0 z-[2]"
              style={{ background: pour }}
              onAnimationEnd={() => {
                commit({ ...stateRef.current, water: pour });
                setPour(null);
              }}
            />
          )}
          <div
            className="absolute bottom-0 left-0 z-[3] h-12 w-full transition-colors duration-500"
            style={{ background: state.gravel }}
          />

          {/* decorations: placed, and staying put */}
          {decorItems.map((it) => {
            const d = depthOf(it.fy * (env.current.h || 400), env.current.h || 400);
            const isPlant = it.kind === 'decor:plant';
            return (
              <div
                key={it.id}
                onPointerDown={(e) => startExisting(it, e)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
                style={{ left: `${it.fx * 100}%`, top: `${it.fy * 100}%`, zIndex: d.z }}
              >
                <div style={{ transform: `scale(${d.scale})`, opacity: d.opacity }}>
                  <div className={landing.includes(it.id) ? 'cc-land' : undefined}>
                    <div
                      ref={
                        isPlant
                          ? (n) => {
                              plantEls.current.set(it.id, n);
                            }
                          : undefined
                      }
                      className={isPlant ? 'origin-bottom' : undefined}
                    >
                      {decorArt(it.kind, SIZE[it.kind] ?? 92)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* fish: alive */}
          {tick >= 0 &&
            fish.current.map((f) => (
              <div
                key={f.key}
                ref={(n) => {
                  fishEls.current.set(f.key, n);
                }}
                onPointerDown={(e) => {
                  const it = stateRef.current.items.find((i) => i.id === f.key);
                  if (it) startExisting(it, e);
                }}
                className="absolute left-0 top-0 cursor-grab touch-none will-change-transform active:cursor-grabbing"
              >
                <FishSVG species={f.species} size={f.size} />
              </div>
            ))}

          {flakeIds.map((id) => (
            <div
              key={id}
              ref={(n) => {
                flakeEls.current.set(id, n);
              }}
              className="pointer-events-none absolute left-0 top-0 z-[550] h-2 w-2 rounded-full"
              style={{ background: '#C98F4E' }}
            />
          ))}

          {dust.map((p) => (
            <div
              key={p.id}
              onAnimationEnd={() => setDust((x) => x.filter((z) => z.id !== p.id))}
              className="cc-dust pointer-events-none absolute z-[540] h-8 w-8 rounded-full"
              style={{ left: p.x, top: p.y, background: 'radial-gradient(circle, rgba(231,206,143,0.9), rgba(231,206,143,0))' }}
            />
          ))}

          <Caustics reduceMotion={reduceMotion} />

          {ripples.map((r) => (
            <div
              key={r.id}
              onAnimationEnd={() => setRipples((x) => x.filter((z) => z.id !== r.id))}
              className="cc-ripple pointer-events-none absolute z-[700] h-24 w-24 rounded-full"
              style={{ left: r.x, top: r.y }}
            />
          ))}
          {bubbles.map((b) => (
            <div
              key={b.id}
              onAnimationEnd={() => setBubbles((x) => x.filter((z) => z.id !== b.id))}
              className="cc-bubble pointer-events-none absolute z-[720] rounded-full"
              style={{
                left: b.x - b.s / 2,
                top: b.y - b.s / 2,
                width: b.s,
                height: b.s,
                animationDuration: reduceMotion ? '2.6s' : '1.5s',
              }}
            />
          ))}

          {state.items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[730] grid place-items-center text-white/70">
              <span className="text-lg">drag things in ↓</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 pb-3 pt-1">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {TRAY_FISH.map((s) => (
            <button
              key={s}
              onPointerDown={(e) => startNew(`fish:${s}`, e)}
              className="grid h-[72px] w-[72px] touch-none place-items-center rounded-cozy bg-white/70 shadow-sm active:scale-95"
              aria-label={s}
            >
              <FishSVG species={s} size={60} />
            </button>
          ))}
          {TRAY_DECOR.map((k) => (
            <button
              key={k}
              onPointerDown={(e) => startNew(`decor:${k}`, e)}
              className="grid h-[72px] w-[72px] touch-none place-items-center rounded-cozy bg-white/70 shadow-sm active:scale-95"
              aria-label={k}
            >
              <DecorSVG kind={k} size={56} />
            </button>
          ))}
        </div>
        <div
          ref={trashRef}
          className="grid h-[72px] w-[72px] place-items-center rounded-cozy border-2 border-dashed"
          style={{ borderColor: theme.scale[400] }}
          aria-label="Remove"
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={theme.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
          </svg>
        </div>
      </div>

      {ghost && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-90" style={{ left: ghost.x, top: ghost.y }}>
          {decorArt(ghost.kind, SIZE[ghost.kind] ?? 92)}
        </div>
      )}
    </div>
  );
}
