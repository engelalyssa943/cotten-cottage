import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { DecorSVG, FishSVG, type Species } from './art';

/**
 * `sprout` mode. A tank of chunky fish drifting on gentle sine paths. Tap anywhere
 * → a bubble and the nearest fish swims over with a happy wiggle. Tap a fish → it
 * spins with delight. No goals, no menu, nothing to lose. It stays alive when left
 * alone. Exit is the hold-corner the app draws — nothing here is a child-hittable
 * way out.
 */

interface Fish {
  x: number;
  y: number;
  baseY: number;
  dir: 1 | -1;
  vx: number;
  phase: number;
  amp: number;
  freq: number;
  species: Species;
  size: number;
  spin: number;
  targetX: number | null;
  targetY: number | null;
}

const POOL: Species[] = ['clownfish', 'tang', 'sunny', 'angelfish', 'goldie', 'tang'];

export function SproutTank({ sound, reduceMotion }: GameProps) {
  const container = useRef<HTMLDivElement>(null);
  const fish = useRef<Fish[]>([]);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const lastActive = useRef(performance.now());
  const nextBubble = useRef(0);
  const [ready, setReady] = useState(false);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; s: number }[]>([]);

  function spawnBubble(x: number, y: number) {
    const id = nextBubble.current++;
    setBubbles((b) => [...b, { id, x, y, s: 12 + Math.random() * 18 }]);
  }

  // Stock the tank once we know how big it is.
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    fish.current = Array.from({ length: 6 }, (_, i) => {
      const y = h * (0.2 + Math.random() * 0.55);
      return {
        x: w * (0.12 + Math.random() * 0.76),
        y,
        baseY: y,
        dir: Math.random() < 0.5 ? 1 : -1,
        vx: (reduceMotion ? 16 : 38) + Math.random() * 26,
        phase: Math.random() * Math.PI * 2,
        amp: reduceMotion ? 7 : 16,
        freq: 0.7 + Math.random() * 0.6,
        species: POOL[i % POOL.length],
        size: 132 + Math.random() * 44,
        spin: 0,
        targetX: null,
        targetY: null,
      };
    });
    setReady(true);
  }, [reduceMotion]);

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
        const w = el.clientWidth;
        const h = el.clientHeight;

        // Stay alive when untouched: a gentle group wiggle + a stray bubble.
        if (now - lastActive.current > 30000) {
          for (const f of fish.current) f.spin = Math.max(f.spin, 0.6);
          spawnBubble(w * (0.15 + Math.random() * 0.7), h * 0.72);
          lastActive.current = now - 22000; // repeat every ~8s while idle
        }

        fish.current.forEach((f, i) => {
          if (f.targetX !== null && f.targetY !== null) {
            const dx = f.targetX - f.x;
            const dy = f.targetY - f.y;
            const dist = Math.hypot(dx, dy) || 1;
            f.dir = dx >= 0 ? 1 : -1;
            const speed = reduceMotion ? 55 : 120;
            if (dist < 10) {
              f.targetX = null;
              f.targetY = null;
              f.baseY = f.y;
              f.spin = Math.max(f.spin, 0.5);
            } else {
              f.x += (dx / dist) * speed * dt;
              f.y += (dy / dist) * speed * dt;
              f.baseY = f.y;
            }
          } else {
            f.x += f.dir * f.vx * dt;
            if (f.x < w * 0.06) {
              f.x = w * 0.06;
              f.dir = 1;
            } else if (f.x > w * 0.94) {
              f.x = w * 0.94;
              f.dir = -1;
            }
            f.phase += f.freq * dt;
            f.y = f.baseY + Math.sin(f.phase) * f.amp;
          }
          if (f.spin > 0) f.spin = Math.max(0, f.spin - dt);
          const spinDeg = f.spin > 0 ? (1 - f.spin / 0.6) * 360 : 0;
          const node = els.current[i];
          if (node) {
            node.style.transform = `translate(${f.x}px, ${f.y}px) translate(-50%, -50%) rotate(${spinDeg}deg) scaleX(${f.dir === 1 ? -1 : 1})`;
          }
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, reduceMotion]);

  function tap(e: React.PointerEvent) {
    const el = container.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastActive.current = performance.now();
    spawnBubble(x, y);
    let best = -1;
    let bd = Infinity;
    fish.current.forEach((f, i) => {
      const d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) {
      fish.current[best].targetX = x;
      fish.current[best].targetY = y;
    }
    sound.blip();
  }

  function tapFish(i: number, e: React.PointerEvent) {
    e.stopPropagation();
    lastActive.current = performance.now();
    const f = fish.current[i];
    if (f) f.spin = 0.6;
    sound.pop();
  }

  return (
    <div
      ref={container}
      onPointerDown={tap}
      className="relative h-screen w-screen touch-none overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #BEE7F5 0%, #7FC6E6 70%, #66B6DC 100%)' }}
    >
      {/* gravel + a couple of calm plants */}
      <div className="absolute bottom-0 left-0 h-16 w-full" style={{ background: '#E7CE8F' }} />
      <div className="pointer-events-none absolute bottom-6 left-[8%]">
        <DecorSVG kind="plant" size={140} />
      </div>
      <div className="pointer-events-none absolute bottom-6 right-[10%]">
        <DecorSVG kind="plant" size={110} />
      </div>

      {ready &&
        fish.current.map((f, i) => (
          <div
            key={i}
            ref={(n) => {
              els.current[i] = n;
            }}
            onPointerDown={(e) => tapFish(i, e)}
            className="absolute left-0 top-0 will-change-transform"
          >
            <FishSVG species={f.species} size={f.size} />
          </div>
        ))}

      {bubbles.map((b) => (
        <div
          key={b.id}
          onAnimationEnd={() => setBubbles((x) => x.filter((z) => z.id !== b.id))}
          className="cc-bubble pointer-events-none absolute rounded-full"
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
