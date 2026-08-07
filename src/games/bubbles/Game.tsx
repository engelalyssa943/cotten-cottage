import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { TreasureSVG, TREASURES, type Treasure } from './treasures';

/**
 * Bubbles.
 *
 * They drift up, he swats them, they pop. That is the whole game, and at one
 * year old that is not a small thing — it is cause and effect plus tracking a
 * moving target with a hand, which is most of what he is working on.
 *
 * Nothing is ever missed. A bubble that reaches the top simply floats away and
 * another comes; there is no score for catching them and no loss for not. Every
 * so often one has something inside it, which becomes a card in the Attic.
 *
 * The two bands differ only in how hard the target is — bigger and slower for
 * him now, smaller and quicker at three — not in what the game is.
 *
 * Rendered as DOM nodes moved by a frame loop, the same way the aquarium works,
 * rather than canvas: it keeps the treasures as ordinary SVG components and
 * avoids drawing them twice in two different languages.
 */

interface Bubble {
  id: number;
  x: number;
  y: number;
  r: number;
  vy: number;
  /** Sideways sway. */
  phase: number;
  freq: number;
  amp: number;
  /**
   * Where it is actually DRAWN this frame, sway included. The hit test must use
   * this and not `x`: they differ by up to the sway amplitude, and testing
   * against `x` meant a finger landing dead centre on a bubble could miss it
   * while one landing well off to the side could pop it.
   */
  drawX: number;
  tint: string;
  treasure?: Treasure;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  r: number;
  treasure?: Treasure;
}

const TINTS = ['#BFE6F2', '#F7C9DE', '#D9CDF2', '#C8ECD8', '#FBE3A2'];

export default function BubblesGame({ band, theme, sound, award, reduceMotion }: GameProps) {
  const little = band === 'sprout';
  const host = useRef<HTMLDivElement>(null);
  const bubbles = useRef<Bubble[]>([]);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const nextId = useRef(1);
  const sinceSpawn = useRef(0);
  const treasureClock = useRef(0);
  const treasureTurn = useRef(0);
  const size = useRef({ w: 800, h: 600 });

  const [ids, setIds] = useState<number[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const live = useRef({ reduceMotion, sound, award });
  live.current = { reduceMotion, sound, award };

  // Bigger, slower and more forgiving for the littlest.
  const spec = little
    ? { rMin: 52, rMax: 92, vMin: 26, vMax: 46, every: 0.95, max: 11, grab: 1.32 }
    : { rMin: 34, rMax: 64, vMin: 44, vMax: 74, every: 0.62, max: 15, grab: 1.14 };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => { size.current = { w: el.clientWidth, h: el.clientHeight }; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const spawn = () => {
      const s = size.current;
      const r = spec.rMin + Math.random() * (spec.rMax - spec.rMin);
      // Every so often, one is carrying something. They take turns, so he meets
      // all four rather than getting the same one over and over.
      treasureClock.current += 1;
      let treasure: Treasure | undefined;
      if (treasureClock.current >= 7) {
        treasureClock.current = 0;
        treasure = TREASURES[treasureTurn.current % TREASURES.length];
        treasureTurn.current += 1;
      }
      const x = r + Math.random() * Math.max(1, s.w - r * 2);
      bubbles.current.push({
        id: nextId.current++,
        x,
        drawX: x,
        y: s.h + r,
        r,
        vy: spec.vMin + Math.random() * (spec.vMax - spec.vMin),
        phase: Math.random() * Math.PI * 2,
        freq: 0.4 + Math.random() * 0.5,
        amp: reduceMotion ? 0 : 10 + Math.random() * 22,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        treasure,
      });
      setIds(bubbles.current.map((b) => b.id));
    };

    let raf = 0;
    let prev = performance.now() / 1000;
    const tick = (t: number) => {
      const now = t / 1000;
      // Floored at zero: a frame stamped before the previous one would otherwise
      // run everything backwards. (Same lesson as the pond.)
      const dt = Math.max(0, Math.min(0.05, now - prev));
      prev = now;
      try {
        const rm = live.current.reduceMotion;
        sinceSpawn.current += dt;
        if (sinceSpawn.current >= spec.every && bubbles.current.length < spec.max) {
          sinceSpawn.current = 0;
          spawn();
        }

        let gone = false;
        for (const b of bubbles.current) {
          b.y -= b.vy * (rm ? 0.55 : 1) * dt;
          const sway = rm ? 0 : Math.sin(now * b.freq + b.phase) * b.amp;
          b.drawX = b.x + sway;
          const node = nodes.current.get(b.id);
          if (node) node.style.transform = `translate(${(b.drawX - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px)`;
          if (b.y + b.r < -10) gone = true;
        }
        if (gone) {
          // Floated away. No fanfare, no loss — another is already on its way.
          bubbles.current = bubbles.current.filter((b) => b.y + b.r >= -10);
          setIds(bubbles.current.map((b) => b.id));
        }
      } catch (err) {
        // One bad frame must never end the game; dropping the loop would leave
        // a dead screen only a grown-up could rescue.
        if (import.meta.env.DEV) console.error('[bubbles] skipped a frame', err);
      } finally {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [band]);

  function swat(e: React.PointerEvent) {
    const el = host.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;

    // Topmost first, so the one that looks nearest the finger is the one that goes.
    const hit = [...bubbles.current]
      .reverse()
      .find((b) => Math.hypot(b.drawX - px, b.y - py) <= b.r * spec.grab);
    if (!hit) return;

    const { sound: sfx, award: give } = live.current;
    // Bigger bubbles get a lower note, which is what a bigger bubble should sound like.
    const step = Math.max(0, Math.round(7 - ((hit.r - spec.rMin) / (spec.rMax - spec.rMin)) * 7));
    sfx.pop(step);

    if (hit.treasure) {
      sfx.sparkle();
      give(`bubbles:${hit.treasure}`);
    }

    const burst: Burst = { id: hit.id, x: hit.x, y: hit.y, r: hit.r, treasure: hit.treasure };
    setBursts((bs) => [...bs, burst]);
    window.setTimeout(() => setBursts((bs) => bs.filter((b) => b.id !== burst.id)), 700);

    bubbles.current = bubbles.current.filter((b) => b.id !== hit.id);
    nodes.current.delete(hit.id);
    setIds(bubbles.current.map((b) => b.id));
  }

  return (
    <div
      className="h-full w-full pl-[var(--cc-rail)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[200]}, ${theme.scale[100]})` }}
    >
      {/* Everything lives inside the padding, so no bubble can drift under the
          rail where it would be unreachable. */}
      <div
        ref={host}
        onPointerDown={swat}
        className="relative h-full w-full touch-none overflow-hidden"
      >
        {ids.map((id) => {
          const b = bubbles.current.find((x) => x.id === id);
          if (!b) return null;
          return (
            <div
              key={id}
              ref={(n) => { if (n) nodes.current.set(id, n); else nodes.current.delete(id); }}
              className="pointer-events-none absolute left-0 top-0 grid place-items-center rounded-full"
              style={{
                width: b.r * 2,
                height: b.r * 2,
                background: `radial-gradient(circle at 34% 30%, #FFFFFFEE, ${b.tint}AA 55%, ${b.tint}55 78%, #FFFFFF22)`,
                boxShadow: `inset 0 0 ${b.r * 0.4}px #FFFFFFAA, 0 2px 8px rgba(0,0,0,0.06)`,
                border: '2px solid #FFFFFF88',
              }}
            >
              {b.treasure && <TreasureSVG treasure={b.treasure} size={b.r * 0.9} />}
            </div>
          );
        })}

        {bursts.map((b) => (
          <div
            key={`burst-${b.id}`}
            className={`pointer-events-none absolute grid place-items-center ${reduceMotion ? 'cc-burst-soft' : 'cc-burst'}`}
            style={{ left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2 }}
          >
            <span className="absolute inset-0 rounded-full" style={{ border: '3px solid #FFFFFFCC' }} />
            {b.treasure && <TreasureSVG treasure={b.treasure} size={b.r * 0.9} />}
          </div>
        ))}
      </div>
    </div>
  );
}
