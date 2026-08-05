import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { Door } from './Door';
import { ANIMALS, speak, type Animal } from './animals';

/** A stable shuffle, so the cupboards aren't rearranged mid-play. */
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
 * `sprout` mode. Six doors, six friends, and nothing else.
 *
 * Object permanence is the thing a one-year-old is actually working on, and
 * this is the whole of it: something is gone, you open the door, it was there
 * all along. Tap it again and you can hide them again, which is the half
 * grown-ups always forget is the good half.
 *
 * No target, no order, no round to finish. Every door works every time.
 */
export function Cupboards({ theme, sound, award, reduceMotion }: GameProps) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(180);
  const [open, setOpen] = useState<Set<number>>(new Set());
  // Fixed for the life of the visit: the rabbit stays the rabbit's cupboard.
  const [cast] = useState<Animal[]>(() => shuffled(ANIMALS));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth - GAP * (COLS - 1);
      const h = el.clientHeight - GAP * (ROWS - 1);
      setSize(Math.max(120, Math.floor(Math.min(w / COLS, h / ROWS))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function tap(i: number, animal: Animal) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
        sound.pop(0); // the door bumping shut
      } else {
        next.add(i);
        speak(animal, sound);
        award(`peekaboo:${animal}`);
      }
      return next;
    });
  }

  return (
    <div
      ref={box}
      className="flex h-full w-full flex-wrap content-center justify-center gap-[18px] p-4 pl-[calc(var(--cc-rail)+1rem)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[200]})` }}
    >
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
  );
}
