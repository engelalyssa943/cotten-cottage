import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { THINGS, ThingSVG, type Thing } from './things';

/**
 * How many?
 *
 * Two kinds of round, alternating, because counting runs in two directions and
 * a child can manage one long before the other:
 *
 *  - COUNT: here are some ducks, which numeral says how many? Going from a
 *    quantity you can see to the symbol for it.
 *  - MAKE: here is a 6, put six apples in the tray. Going from the symbol back
 *    to a quantity, one apple at a time — which is one-to-one correspondence,
 *    the thing that actually underpins counting.
 *
 * Nothing can go wrong in either. A numeral that isn't the answer gives a shake
 * and stays put; a tray that isn't right yet gives a shake and stays put.
 * Nothing is ever taken away and there is no limit on tries.
 *
 * MAKE rounds finish two different ways on purpose. While the tray still shows
 * empty outlines, filling the last one finishes it — the outlines are the
 * scaffold, and matching things to spaces one at a time IS the exercise. Once
 * the outlines are gone, she has to say when she's done, because a tray that
 * completed itself the moment it held the right number could be beaten by
 * tapping the pile over and over without counting at all.
 *
 * Difficulty drifts the same invisible way as the other two: judged over three
 * rounds at a time rather than reacting to every single one, so a stray tap
 * never yanks it about.
 */

interface Save {
  level: number;
}

interface Rung {
  /** Highest quantity that can come up. */
  max: number;
  /** Jumbled rather than laid out in rows. */
  scatter: boolean;
  /** How many numerals to choose between. */
  choices: number;
  /** Empty outlines to fill, which give away the answer by shape. */
  slots: boolean;
}

const LADDER: Rung[] = [
  { max: 5, scatter: false, choices: 3, slots: true },
  { max: 5, scatter: true, choices: 3, slots: true },
  { max: 10, scatter: false, choices: 4, slots: true },
  { max: 10, scatter: true, choices: 4, slots: false },
  { max: 15, scatter: true, choices: 4, slots: false },
  { max: 20, scatter: true, choices: 5, slots: false },
];

/** Neighbouring numbers make far better distractors than random ones. */
function choicesFor(n: number, want: number, max: number): number[] {
  const out = new Set<number>([n]);
  for (let d = 1; out.size < want && d <= max; d++) {
    if (n - d >= 1) out.add(n - d);
    if (out.size < want && n + d <= max) out.add(n + d);
  }
  const arr = [...out];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export default function HowManyGame({ band, theme, sound, save, award, reduceMotion }: GameProps) {
  const [level, setLevel] = useState(band === 'star' ? 3 : 0);
  const [mode, setMode] = useState<'count' | 'make'>('count');
  const [thing, setThing] = useState<Thing>(() => pick(THINGS));
  const [n, setN] = useState(3);
  const [inTray, setInTray] = useState(0);
  const [shaking, setShaking] = useState<number | null>(null);
  const [trayShake, setTrayShake] = useState(false);
  const [done, setDone] = useState(false);
  const [box, setBox] = useState({ w: 900, h: 600 });
  const [seed, setSeed] = useState(0);

  const host = useRef<HTMLDivElement>(null);
  const wrong = useRef(0);
  const roundsInWindow = useRef(0);
  const timers = useRef<number[]>([]);
  const melody = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const rung = LADDER[Math.min(LADDER.length - 1, Math.max(0, level))];

  useEffect(() => {
    let live = true;
    void save.load<Save>().then((d) => {
      if (!live || typeof d?.level !== 'number') return;
      setLevel(Math.min(LADDER.length - 1, Math.max(0, d.level)));
    });
    return () => { live = false; };
  }, [save]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const deal = useCallback((lvl: number, nextMode: 'count' | 'make') => {
    const r = LADDER[Math.min(LADDER.length - 1, Math.max(0, lvl))];
    setLevel(lvl);
    setMode(nextMode);
    setThing(pick(THINGS));
    setN(1 + Math.floor(Math.random() * r.max));
    setInTray(0);
    setDone(false);
    setSeed((s) => s + 1);
  }, []);

  /** Judged three rounds at a time, so one stray tap can't move the floor. */
  function finishRound() {
    setDone(true);
    award(`how-many:${thing}`);
    for (let i = 0; i < 4; i++) after(200 + i * 130, () => sound.chime(i + 3));

    roundsInWindow.current += 1;
    let lvl = level;
    if (roundsInWindow.current >= 3) {
      if (wrong.current === 0) lvl = Math.min(LADDER.length - 1, level + 1);
      else if (wrong.current >= 4) lvl = Math.max(0, level - 1);
      if (lvl !== level) void save.put<Save>({ level: lvl });
      wrong.current = 0;
      roundsInWindow.current = 0;
    }
    after(2200, () => deal(lvl, mode === 'count' ? 'make' : 'count'));
  }

  function tapNumeral(value: number) {
    if (done) return;
    if (value === n) {
      melody.current = (melody.current + 1) % 8;
      sound.pop(melody.current);
      finishRound();
      return;
    }
    wrong.current += 1;
    setShaking(value);
    sound.pop(0);
    after(420, () => setShaking(null));
  }

  function addOne() {
    if (done) return;
    const next = inTray + 1;
    setInTray(next);
    sound.blip(Math.min(7, next));
    // With outlines to fill, the last one lands it. Without them, she says when.
    if (rung.slots && next === n) after(120, finishRound);
  }

  function removeOne() {
    if (done || inTray === 0) return;
    setInTray((v) => v - 1);
    sound.pop(0);
  }

  /** Only on the harder rounds, where nothing on screen gives the number away. */
  function check() {
    if (done) return;
    if (inTray === n) {
      finishRound();
      return;
    }
    wrong.current += 1;
    setTrayShake(true);
    sound.pop(0);
    after(420, () => setTrayShake(false));
  }

  // ---- laying the things out ----
  const stageH = box.h * 0.6;
  const layout = useMemo(() => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.7)));
    const rows = Math.max(1, Math.ceil(n / cols));
    const cw = (box.w - 60) / cols;
    const ch = (stageH - 20) / rows;
    const size = Math.max(34, Math.min(110, Math.min(cw, ch) * 0.74));
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      // A fixed pseudo-random per index, so it doesn't reshuffle every render.
      const h = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
      const j1 = (h - Math.floor(h)) - 0.5;
      const h2 = Math.sin((i + 1) * 39.3468 + seed * 11.135) * 24634.6345;
      const j2 = (h2 - Math.floor(h2)) - 0.5;
      return {
        left: 30 + c * cw + cw / 2 + (rung.scatter ? j1 * cw * 0.55 : 0),
        top: 10 + r * ch + ch / 2 + (rung.scatter ? j2 * ch * 0.5 : 0),
        rot: rung.scatter ? j1 * 34 : 0,
        size,
      };
    });
  }, [n, box.w, stageH, rung.scatter, seed]);

  const options = useMemo(() => choicesFor(n, rung.choices, rung.max), [n, rung, seed]);

  return (
    <div
      ref={host}
      className="relative h-full w-full overflow-hidden pl-[var(--cc-rail)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[300]})` }}
    >
      {mode === 'count' ? (
        <>
          {/* the things to count */}
          <div className="absolute inset-x-0 top-0" style={{ height: stageH }}>
            {layout.map((p, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: p.left, top: p.top, transform: `translate(-50%,-50%) rotate(${p.rot}deg)` }}
              >
                <ThingSVG thing={thing} size={p.size} />
              </div>
            ))}
          </div>

          {/* which numeral says how many */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 px-4 pb-4 pl-[calc(var(--cc-rail)+1rem)]">
            {options.map((v) => (
              <button
                key={v}
                onPointerDown={() => tapNumeral(v)}
                aria-label={`${v}`}
                className={`grid place-items-center rounded-cozy bg-white/90 shadow-md active:scale-95 ${shaking === v && !reduceMotion ? 'cc-shake' : ''}`}
                style={{ width: box.h * 0.19, height: box.h * 0.19, minWidth: 84, minHeight: 84 }}
              >
                <span className="font-semibold text-ink" style={{ fontSize: Math.max(40, box.h * 0.11) }}>
                  {v}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* the numeral, and a tray to fill */}
          <div className="absolute inset-0 flex items-center gap-6 px-6 pl-[calc(var(--cc-rail)+1.5rem)]">
            <div
              className="grid shrink-0 place-items-center rounded-cozy bg-white/90 shadow-md"
              style={{ width: box.h * 0.3, height: box.h * 0.3 }}
            >
              <span className="font-semibold text-ink" style={{ fontSize: box.h * 0.19 }}>
                {n}
              </span>
            </div>

            <div
              className={`flex h-[62%] min-w-0 flex-1 flex-wrap content-center items-center justify-center gap-3 rounded-cozy p-4 ${trayShake && !reduceMotion ? 'cc-shake' : ''}`}
              style={{ background: 'rgba(255,255,255,0.45)', outline: `3px dashed ${theme.scale[400]}` }}
            >
              {Array.from({ length: rung.slots ? Math.max(n, inTray) : inTray }, (_, i) => {
                const filled = i < inTray;
                const s = Math.max(34, Math.min(84, (box.h * 0.42) / Math.ceil(Math.max(n, 1) / 5)));
                return filled ? (
                  <button key={i} onPointerDown={removeOne} aria-label="take one out" className="active:scale-95">
                    <ThingSVG thing={thing} size={s} />
                  </button>
                ) : (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{ width: s * 0.72, height: s * 0.72, border: `3px dashed ${theme.scale[500]}`, opacity: 0.5 }}
                  />
                );
              })}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3">
              <button
                onPointerDown={addOne}
                aria-label="add one"
                className="grid place-items-center rounded-cozy bg-white/90 shadow-md active:scale-95"
                style={{ width: box.h * 0.3, height: box.h * 0.3 }}
              >
                <ThingSVG thing={thing} size={box.h * 0.19} />
              </button>

              {/* Only where the outlines aren't doing the counting for her. */}
              {!rung.slots && (
                <button
                  onPointerDown={check}
                  aria-label="that's how many"
                  className="grid place-items-center rounded-full shadow-md active:scale-95"
                  style={{ width: box.h * 0.16, height: box.h * 0.16, background: theme.accent }}
                >
                  <svg viewBox="0 0 24 24" className="h-3/5 w-3/5" fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 13l6 6L20 6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
