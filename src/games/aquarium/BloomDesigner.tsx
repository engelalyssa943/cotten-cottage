import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { DecorSVG, FishSVG, type DecorKind, type Species } from './art';
import { DISCOVERY_SPECIES, discoveriesFor } from './collectibles';

/**
 * `bloom` mode. An aquarium *designer*: drag fish, plants, rocks, a castle and a
 * treasure chest into the tank, recolor the water, gravel and background, and
 * everything is saved. Combining decorations can reveal a new species for the
 * Collection Book. Nothing is ever wrong; anything can be freely removed.
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

function renderKind(kind: string, size: number) {
  if (kind.startsWith('fish:')) return <FishSVG species={kind.slice(5) as Species} size={size} />;
  return <DecorSVG kind={kind.slice(6) as DecorKind} size={size} />;
}

const SIZE: Record<string, number> = {
  'fish:clownfish': 88, 'fish:tang': 88, 'fish:sunny': 88, 'fish:angelfish': 88,
  'fish:seahorse': 78, 'fish:jelly': 84, 'fish:goldie': 88,
  'decor:plant': 96, 'decor:rock': 84, 'decor:castle': 104, 'decor:chest': 92,
};

interface Drag {
  kind: string;
  x: number;
  y: number;
  existingId?: string;
}

export function BloomDesigner({ save, award, sound, theme }: GameProps) {
  const [state, setState] = useState<Save>(DEFAULT_SAVE);
  const [ghost, setGhost] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const tankRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void save.load<Save>().then((d) => {
      if (d) setState({ ...DEFAULT_SAVE, ...d });
    });
  }, [save]);

  function commit(next: Save) {
    setState(next);
    save.put(next);
  }

  function inside(ref: React.RefObject<HTMLElement>, x: number, y: number): DOMRect | null {
    const r = ref.current?.getBoundingClientRect();
    if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return r;
    return null;
  }

  function runDiscovery(next: Save): Save {
    const found = discoveriesFor(next.items.map((i) => i.kind));
    let result = next;
    for (const id of found) {
      if (result.discovered.includes(id)) continue;
      award(id);
      const species = DISCOVERY_SPECIES[id];
      result = {
        ...result,
        discovered: [...result.discovered, id],
        items: [
          ...result.items,
          { id: crypto.randomUUID(), kind: `fish:${species}`, fx: 0.2 + Math.random() * 0.6, fy: 0.2 + Math.random() * 0.5 },
        ],
      };
    }
    return result;
  }

  function finish(x: number, y: number) {
    const d = dragRef.current;
    dragRef.current = null;
    setGhost(null);
    if (!d) return;

    if (d.existingId && inside(trashRef, x, y)) {
      commit({ ...state, items: state.items.filter((i) => i.id !== d.existingId) });
      sound.pop();
      return;
    }
    const tank = inside(tankRef, x, y);
    if (!tank) return; // dropped in the void — no change, nothing lost
    const fx = Math.min(0.96, Math.max(0.04, (x - tank.left) / tank.width));
    const fy = Math.min(0.94, Math.max(0.06, (y - tank.top) / tank.height));

    if (d.existingId) {
      commit({ ...state, items: state.items.map((i) => (i.id === d.existingId ? { ...i, fx, fy } : i)) });
      sound.blip();
    } else {
      const withItem: Save = { ...state, items: [...state.items, { id: crypto.randomUUID(), kind: d.kind, fx, fy }] };
      commit(runDiscovery(withItem));
      sound.blip();
    }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragRef.current) return;
      dragRef.current = { ...dragRef.current, x: e.clientX, y: e.clientY };
      setGhost(dragRef.current);
    };
    const up = (e: PointerEvent) => {
      if (dragRef.current) finish(e.clientX, e.clientY);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // finish/state are read via closures created each render; deps kept minimal on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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

  const Swatches = ({ list, value, onPick }: { list: string[]; value: string; onPick: (c: string) => void }) => (
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

  return (
    <div className="flex h-screen w-screen flex-col" style={{ background: state.bg }}>
      {/* color controls */}
      <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <Swatches list={WATERS} value={state.water} onPick={(c) => commit({ ...state, water: c })} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🪨</span>
          <Swatches list={GRAVELS} value={state.gravel} onPick={(c) => commit({ ...state, gravel: c })} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <Swatches list={BGS} value={state.bg} onPick={(c) => commit({ ...state, bg: c })} />
        </div>
      </div>

      {/* tank */}
      <div className="relative flex-1 px-4 pb-2">
        <div
          ref={tankRef}
          className="relative h-full w-full overflow-hidden rounded-cozy shadow-inner"
          style={{ background: `linear-gradient(180deg, ${state.water} 0%, ${state.water} 70%, ${shade(state.water)} 100%)` }}
        >
          <div className="absolute bottom-0 left-0 h-12 w-full" style={{ background: state.gravel }} />
          {state.items.map((it) => (
            <div
              key={it.id}
              onPointerDown={(e) => startExisting(it, e)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
              style={{ left: `${it.fx * 100}%`, top: `${it.fy * 100}%` }}
            >
              {renderKind(it.kind, SIZE[it.kind] ?? 88)}
            </div>
          ))}
          {state.items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-white/70">
              <span className="text-lg">drag things in ↓</span>
            </div>
          )}
        </div>
      </div>

      {/* tray + trash */}
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

      {/* drag ghost */}
      {ghost && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 opacity-90"
          style={{ left: ghost.x, top: ghost.y }}
        >
          {renderKind(ghost.kind, SIZE[ghost.kind] ?? 88)}
        </div>
      )}
    </div>
  );
}

/** A slightly deeper version of a hex color, for the tank's depth gradient. */
function shade(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 28);
  const g = Math.max(0, ((n >> 8) & 255) - 28);
  const b = Math.max(0, (n & 255) - 28);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
