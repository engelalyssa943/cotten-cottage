import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { DecorSVG, FishSVG, type Species } from './art';
import { Caustics } from './Caustics';
import { createFish, paintFish, plantMotion, step, type Flake, type SimEnv, type SimFish } from './sim';

/**
 * `sprout` mode. A tank that is simply alive. Tap → a bubble, and whoever is
 * nearest comes to see. Hold your finger → they follow it. Keep holding → food
 * drifts down and everyone comes to eat. Tap the surface → a ripple. Tap a fish →
 * it spins. No goals, no menu, nothing to lose, no way out except the hold-corner.
 */

const POOL: Species[] = ['clownfish', 'tang', 'sunny', 'angelfish', 'goldie', 'tang'];
const PLANTS = [
  { fx: 0.1, size: 150 },
  { fx: 0.88, size: 118 },
];

export function SproutTank({ sound, reduceMotion }: GameProps) {
  const container = useRef<HTMLDivElement>(null);
  const fish = useRef<SimFish[]>([]);
  const fishEls = useRef<(HTMLDivElement | null)[]>([]);
  const plantEls = useRef<(HTMLDivElement | null)[]>([]);
  const flakeEls = useRef(new Map<number, HTMLDivElement | null>());
  const holdSince = useRef(0);
  const lastFeed = useRef(0);
  const nextId = useRef(1);
  const env = useRef<SimEnv>({
    w: 0,
    h: 0,
    attractor: null,
    flakes: [],
    plants: [],
    timeScale: 1,
    reduceMotion,
  });
  env.current.reduceMotion = reduceMotion;

  const [ready, setReady] = useState(false);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; s: number }[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [flakeIds, setFlakeIds] = useState<number[]>([]);

  const addBubble = (x: number, y: number) =>
    setBubbles((b) => [...b, { id: nextId.current++, x, y, s: 12 + Math.random() * 18 }]);

  const addFlakes = (x: number, y: number) => {
    const made: Flake[] = [];
    for (let i = 0; i < 3; i++) {
      made.push({
        id: nextId.current++,
        x: x + (Math.random() * 60 - 30),
        y: y + (Math.random() * 20 - 10),
        vy: 14 + Math.random() * 16,
      });
    }
    env.current.flakes.push(...made);
    setFlakeIds((ids) => [...ids, ...made.map((f) => f.id)]);
  };

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

  // Stock the tank once we know how big it is.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    env.current.w = w;
    env.current.h = h;
    env.current.plants = PLANTS.map((p) => ({ x: p.fx * w, y: h - 70 }));
    fish.current = POOL.map((species, i) =>
      createFish({
        key: `f${i}`,
        species,
        x: w * (0.12 + Math.random() * 0.76),
        y: h * (0.18 + Math.random() * 0.5),
        size: 128 + Math.random() * 40,
      }),
    );
    setReady(true);
  }, []);

  // The heartbeat.
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const el = container.current;
      if (el) {
        const e = env.current;
        e.w = el.clientWidth;
        e.h = el.clientHeight;

        // Hold still long enough and food starts drifting down.
        if (e.attractor && now - holdSince.current > 900 && now - lastFeed.current > 260) {
          lastFeed.current = now;
          addFlakes(e.attractor.x, e.attractor.y);
        }

        // Flakes sink; any that reach the gravel are gone. Iterate backwards so a
        // flake can be removed without copying the array every frame.
        for (let i = e.flakes.length - 1; i >= 0; i--) {
          const f = e.flakes[i];
          f.y += f.vy * dt;
          f.x += Math.sin(now / 700 + f.id) * 6 * dt;
          if (f.y > e.h - 74) {
            dropFlake(f.id);
            continue;
          }
          const node = flakeEls.current.get(f.id);
          if (node) node.style.transform = `translate(${f.x}px, ${f.y}px) translate(-50%, -50%)`;
        }

        fish.current.forEach((f, i) => {
          step(f, e, dt, now);
          const node = fishEls.current[i];
          if (node) paintFish(node, f, e);
        });

        PLANTS.forEach((p, i) => {
          const node = plantEls.current[i];
          if (!node) return;
          const { sway, bend } = plantMotion(p.fx * e.w, e.h - 70, fish.current, now, e.reduceMotion);
          node.style.transform = `skewX(${bend}deg) rotate(${sway}deg)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  // Let go of the tank if the finger leaves the window entirely.
  useEffect(() => {
    const release = () => {
      env.current.attractor = null;
      holdSince.current = 0;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  function pointFrom(e: React.PointerEvent) {
    const r = container.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function down(e: React.PointerEvent) {
    const { x, y } = pointFrom(e);
    const now = performance.now();
    env.current.attractor = { x, y };
    holdSince.current = now;
    addBubble(x, y);

    if (y < env.current.h * 0.14) {
      // You broke the surface.
      setRipples((r) => [...r, { id: nextId.current++, x, y }]);
      sound.splash();
    } else {
      sound.blip();
    }
    // A tap alone should still bring someone over.
    let best: SimFish | null = null;
    let bd = Infinity;
    for (const f of fish.current) {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    if (best) best.target = { x, y, until: now + 1800 };
  }

  function move(e: React.PointerEvent) {
    if (!env.current.attractor) return;
    env.current.attractor = pointFrom(e);
  }

  function tapFish(i: number, e: React.PointerEvent) {
    e.stopPropagation();
    const f = fish.current[i];
    if (f) f.spin = 0.5;
    sound.pop();
    const { x, y } = pointFrom(e);
    addBubble(x, y - 20);
  }

  return (
    <div
      ref={container}
      onPointerDown={down}
      onPointerMove={move}
      className="relative h-screen w-screen touch-none overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #BEE7F5 0%, #7FC6E6 70%, #66B6DC 100%)' }}
    >
      <div className="absolute bottom-0 left-0 z-[1] h-16 w-full" style={{ background: '#E7CE8F' }} />

      {PLANTS.map((p, i) => (
        <div
          key={i}
          ref={(n) => {
            plantEls.current[i] = n;
          }}
          className="pointer-events-none absolute bottom-6 z-[60] origin-bottom"
          style={{ left: `${p.fx * 100}%`, marginLeft: -p.size / 2 }}
        >
          <DecorSVG kind="plant" size={p.size} />
        </div>
      ))}

      {ready &&
        fish.current.map((f, i) => (
          <div
            key={f.key}
            ref={(n) => {
              fishEls.current[i] = n;
            }}
            onPointerDown={(e) => tapFish(i, e)}
            className="absolute left-0 top-0 will-change-transform"
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
    </div>
  );
}
