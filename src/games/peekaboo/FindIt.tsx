import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { Door } from './Door';
import { AnimalSVG, ANIMALS, speak, type Animal } from './animals';

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const COLS = 3;
const ROWS = 2;
const GAP = 18;

/**
 * `bud` mode — the same cupboards, now with somebody to look for.
 *
 * The card on the left shows who is hiding. Open doors until you find them.
 *
 * Opening the "wrong" door is not wrong: that animal says hello, waves, and
 * closes its door again, and you keep looking. There is no counter, no limit
 * on doors, and no way to end a round without finding who you were after — so
 * the game is a search, never a test. A three-year-old who opens all six in
 * order has played it exactly as intended.
 */
export function FindIt({ theme, sound, award, reduceMotion }: GameProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(160);
  const [cast, setCast] = useState<Animal[]>(() => shuffled(ANIMALS));
  const [target, setTarget] = useState<Animal>(() => ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [found, setFound] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth - GAP * (COLS - 1);
      const h = el.clientHeight - GAP * (ROWS - 1);
      setSize(Math.max(96, Math.floor(Math.min(w / COLS, h / ROWS))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Every scheduled beat is a display duration; none of them is a countdown,
  // and all of them are cancelled if the child leaves mid-round.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  function nextRound() {
    setCast(shuffled(ANIMALS));
    setTarget(ANIMALS[Math.floor(Math.random() * ANIMALS.length)]);
    setOpen(new Set());
    setFound(false);
  }

  function tap(i: number, animal: Animal) {
    if (found || open.has(i)) return;
    setOpen((prev) => new Set(prev).add(i));
    speak(animal, sound);

    if (animal === target) {
      setFound(true);
      award(`peekaboo:${animal}`);
      after(900, () => sound.sparkle());
      after(2200, nextRound);
    } else {
      // Not the one — they wave and tuck themselves back in.
      after(1400, () => setOpen((prev) => { const n = new Set(prev); n.delete(i); return n; }));
    }
  }

  return (
    <div
      className="flex h-full w-full items-center gap-4 p-4 pl-[calc(var(--cc-rail)+1rem)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[200]})` }}
    >
      {/* who we're looking for */}
      <div
        className="grid shrink-0 place-items-center rounded-cozy bg-white/80 p-3 shadow-md"
        style={{ width: 132 }}
      >
        <AnimalSVG animal={target} size={104} still={reduceMotion} />
        <div className="mt-1 text-3xl" aria-hidden>
          {found ? '🎉' : '🔎'}
        </div>
      </div>

      <div ref={box} className="flex min-w-0 flex-1 flex-wrap content-center justify-center gap-[18px]">
        {cast.map((animal, i) => (
          <Door
            key={animal}
            animal={animal}
            open={open.has(i)}
            size={size}
            theme={theme}
            reduceMotion={reduceMotion}
            delay={i * 0.9}
            onTap={() => tap(i, animal)}
          />
        ))}
      </div>
    </div>
  );
}
