import { useEffect, useRef } from 'react';
import type { GameProps } from '../../engine/types';
import { addRipple, createPond, draw, palette, resizePond, step, type Pond } from './pond';

/** Rings from a dragged finger, close enough together to read as one trail. */
const TRAIL_MS = 78;

export default function CalmPondGame({ band, theme, sound, reduceMotion }: GameProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pond = useRef<Pond | null>(null);
  /** Live values for the loop and the handlers, which outlive any one render. */
  const live = useRef({ reduceMotion, theme, sound });
  live.current = { reduceMotion, theme, sound };

  // Pointer bookkeeping: several fingers at once, each with its own trail clock.
  const touches = useRef(new Map<number, number>());
  const melody = useRef({ step: 0, at: 0 });
  const lastTouchAt = useRef(0);
  const nextAmbient = useRef(0);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pond.current) pond.current = createPond(w, h, band);
      else resizePond(pond.current, w, h);
    };
    size();

    const ro = new ResizeObserver(size);
    ro.observe(el);

    let raf = 0;
    let prev = performance.now() / 1000;
    const tick = (t: number) => {
      const now = t / 1000;
      // Also floored at 0: a frame timestamp that lands before the previous one
      // would otherwise run the whole simulation backwards.
      const dt = Math.max(0, Math.min(0.05, now - prev));
      prev = now;
      const p = pond.current;
      try {
        if (p) {
          const { reduceMotion: rm, theme: th, sound: sfx } = live.current;
          step(p, now, dt, rm);
          draw(ctx, p, now, palette(th.favorite, th.accent), rm);

          // The pond hums to itself once it has been left alone for a while.
          // Driven off the frame clock, never off a countdown.
          if (now - lastTouchAt.current > 12) {
            if (nextAmbient.current === 0) nextAmbient.current = now + 4;
            else if (now >= nextAmbient.current) {
              sfx.chime(Math.floor(Math.random() * 5) * (Math.random() < 0.5 ? 1 : 2));
              nextAmbient.current = now + 9 + Math.random() * 6;
            }
          } else {
            nextAmbient.current = 0;
          }
        }
      } catch (err) {
        // A bad frame must never end the pond. Dropping one frame is invisible;
        // dropping the loop means the toy is dead until a grown-up rescues it,
        // which is exactly the failure this game must not have.
        if (import.meta.env.DEV) console.error('[calm-pond] skipped a frame', err);
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

  /** Consecutive touches walk up a pentatonic scale, then reset. */
  function note(): number {
    const t = performance.now();
    melody.current.step = t - melody.current.at > 1600 ? 0 : melody.current.step + 1;
    melody.current.at = t;
    return melody.current.step % 8;
  }

  function at(e: React.PointerEvent): [number, number] {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function down(e: React.PointerEvent) {
    const p = pond.current;
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = at(e);
    const now = performance.now();
    lastTouchAt.current = now / 1000;
    touches.current.set(e.pointerId, now);
    addRipple(p, x, y, now / 1000, 1);
    sound.splash();
    sound.chime(note());
  }

  function move(e: React.PointerEvent) {
    const p = pond.current;
    const last = touches.current.get(e.pointerId);
    if (!p || last === undefined) return;
    const now = performance.now();
    if (now - last < TRAIL_MS) return;
    touches.current.set(e.pointerId, now);
    lastTouchAt.current = now / 1000;
    const [x, y] = at(e);
    // Trailing rings are smaller and mostly silent, so a long drag stays calm.
    addRipple(p, x, y, now / 1000, 0.62);
    if (Math.random() < 0.28) sound.blip(note());
  }

  function up(e: React.PointerEvent) {
    touches.current.delete(e.pointerId);
  }

  return (
    <div
      ref={host}
      className="relative h-full w-full touch-none overflow-hidden"
      style={{ background: theme.scale[100] }}
    >
      <canvas
        ref={canvas}
        className="block h-full w-full"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
    </div>
  );
}
