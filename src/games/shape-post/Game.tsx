import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { HoleSVG, SHAPES, ShapeSVG, type ShapeKind } from './shapes';

/**
 * The posting box.
 *
 * `sprout` (1-2): tap a shape and it sails into its own hole and plunks in.
 * No matching is required of him — a one-year-old cannot reliably match a
 * shape to a hole, and being asked to would just be a wall. What he gets is
 * the thing he is actually working on: I touched that, and it did something,
 * and now it is gone inside. Filling and emptying, over and over.
 *
 * `bud` (3-4): the same box, now a real shape sorter. Tap a shape to pick it
 * up, tap a hole to post it. A hole that doesn't fit gives it a gentle shake
 * and hands the shape back — no sound of failure, nothing lost, no limit on
 * tries, and the shape stays in your hand so you can simply try the next one.
 *
 * Tapping is deliberate over dragging. A dragged shape can be dropped in the
 * wrong place, lost off an edge, or fumbled by hands that don't yet pinch —
 * a tap always lands.
 */

/** Where the holes sit across the lid, and where loose shapes wait below. */
const HOLE_X = [18, 34, 50, 66, 82];
const HOLE_Y = 31;
const HOME_X = [15, 32.5, 50, 67.5, 85];
const HOME_Y = 79;

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Placed = Partial<Record<ShapeKind, boolean>>;

export default function ShapePostGame({ band, theme, sound, award, reduceMotion }: GameProps) {
  const matching = band !== 'sprout';
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(130);
  const [placed, setPlaced] = useState<Placed>({});
  const [flying, setFlying] = useState<ShapeKind | null>(null);
  const [held, setHeld] = useState<ShapeKind | null>(null);
  const [shaking, setShaking] = useState<ShapeKind | null>(null);
  const [round, setRound] = useState(0);
  const flyingRef = useRef<ShapeKind | null>(null);
  const melody = useRef({ step: 0, at: 0 });
  const timers = useRef<number[]>([]);

  /** Which home slot each shape is waiting in — reshuffled every time the box is tipped out. */
  const homeSlot = useMemo(() => {
    const order = shuffled(SHAPES.map((_, i) => i));
    return Object.fromEntries(SHAPES.map((s, i) => [s, order[i]])) as Record<ShapeKind, number>;
  }, [round]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w * 0.145, h * 0.27);
      // The littlest hands get the bigger blocks, whatever the screen.
      setSize(Math.max(band === 'sprout' ? 120 : 96, Math.min(200, Math.floor(s))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [band]);

  function note(): number {
    const t = performance.now();
    melody.current.step = t - melody.current.at > 1500 ? 0 : melody.current.step + 1;
    melody.current.at = t;
    return melody.current.step % 8;
  }

  function post(kind: ShapeKind) {
    if (reduceMotion) {
      land(kind);
      return;
    }
    flyingRef.current = kind;
    setFlying(kind);
    // Safety net: if transitionend never fires, the shape still goes in rather
    // than hanging in mid-air with the box unusable.
    after(900, () => {
      if (flyingRef.current === kind) land(kind);
    });
  }

  /** Guarded by the ref so the transition and the safety net can't both land it. */
  function land(kind: ShapeKind) {
    if (flyingRef.current !== kind && !reduceMotion) return;
    flyingRef.current = null;
    setPlaced((p) => ({ ...p, [kind]: true }));
    setFlying(null);
    setHeld(null);
    sound.pop(note());
    award(`shape-post:${kind}`);
  }

  function tapShape(kind: ShapeKind) {
    if (placed[kind] || flying) return;
    if (!matching) {
      sound.blip(note());
      post(kind);
      return;
    }
    setHeld((h) => (h === kind ? null : kind));
    sound.blip(note());
  }

  function tapHole(kind: ShapeKind) {
    if (!matching || !held || flying || placed[kind]) return;
    if (held === kind) {
      post(kind);
      return;
    }
    // Doesn't fit. The hole shakes its head and you keep hold of the shape.
    setShaking(kind);
    sound.pop(0);
    after(420, () => setShaking(null));
  }

  const full = SHAPES.every((s) => placed[s]);

  function tipOut() {
    if (!full) return;
    SHAPES.forEach((_, i) => after(i * 90, () => sound.pop(i + 1)));
    setPlaced({});
    setHeld(null);
    setRound((r) => r + 1);
  }

  return (
    <div
      ref={box}
      className="relative h-full w-full overflow-hidden pl-[var(--cc-rail)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[300]})` }}
    >
      {/* the box */}
      <button
        onPointerDown={tipOut}
        disabled={!full}
        aria-label={full ? 'Tip the box out' : 'Posting box'}
        className="absolute rounded-cozy disabled:cursor-default"
        style={{
          left: '10%',
          right: '10%',
          top: '10%',
          height: '38%',
          background: 'linear-gradient(180deg,#C69A6D,#A87C51)',
          boxShadow: '0 10px 0 #8A6540, 0 16px 26px rgba(0,0,0,0.22)',
          border: '4px solid #8A6540',
        }}
      >
        {full && (
          <span className="absolute inset-x-0 bottom-2 text-center text-3xl" aria-hidden>
            ⬆︎
          </span>
        )}
      </button>

      {/* holes in the lid */}
      {SHAPES.map((kind, i) => (
        <button
          key={`hole-${kind}`}
          onPointerDown={() => tapHole(kind)}
          disabled={!matching}
          aria-label={`${kind} hole`}
          className={`absolute -translate-x-1/2 -translate-y-1/2 disabled:cursor-default ${shaking === kind && !reduceMotion ? 'cc-shake' : ''}`}
          style={{ left: `${HOLE_X[i]}%`, top: `${HOLE_Y}%` }}
        >
          <span className="relative block">
            <HoleSVG kind={kind} size={size * 0.94} lit={matching && held === kind} />
            {placed[kind] && (
              <span className="absolute inset-0 grid place-items-center opacity-30">
                <ShapeSVG kind={kind} size={size * 0.7} still />
              </span>
            )}
          </span>
        </button>
      ))}

      {/* the shapes still waiting */}
      {SHAPES.map((kind, i) => {
        if (placed[kind]) return null;
        const isFlying = flying === kind;
        const slot = homeSlot[kind];
        const left = isFlying ? HOLE_X[i] : HOME_X[slot];
        const top = isFlying ? HOLE_Y : HOME_Y;
        return (
          <button
            // keyed by round so tipping the box out replays the drop-in
            key={`${kind}-${round}`}
            onPointerDown={() => tapShape(kind)}
            aria-label={kind}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transition: reduceMotion ? undefined : 'left 620ms cubic-bezier(0.4,0,0.3,1), top 620ms cubic-bezier(0.5,0,0.4,1), transform 200ms ease',
              transform: `translate(-50%,-50%) scale(${held === kind ? 1.14 : 1})`,
              zIndex: isFlying ? 20 : 10,
            }}
            onTransitionEnd={(e) => {
              if (isFlying && e.propertyName === 'top') land(kind);
            }}
          >
            <span className={reduceMotion ? 'block' : 'cc-drop'}>
              <ShapeSVG kind={kind} size={size} delay={i * 0.8} still={reduceMotion} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
