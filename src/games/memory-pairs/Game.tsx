import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { MOTIFS, MotifSVG, type Motif } from './motifs';

/**
 * Memory pairs.
 *
 * The difficulty moves on its own and is never shown. The house rules forbid
 * scores, levels and streaks, and they are right to — but a game that never
 * gets harder stops being interesting, and one that gets harder on a visible
 * ladder turns into a test. So the board quietly grows by a pair when a round
 * goes smoothly and quietly shrinks when one drags, and the only thing the
 * child ever sees is a table of cards that happens to keep suiting her.
 *
 * Nothing is counted out loud. There is no move counter, no clock, no "well
 * done", and turning over two that don't match is not an event — they simply
 * turn back, which is what a memory game is made of.
 */

interface Save {
  /** How many pairs the board is currently dealt with. */
  pairs: number;
}

const MIN_PAIRS = 3;
const MAX_PAIRS = MOTIFS.length;

/** Board shapes that fill a landscape screen without leaving a ragged row. */
const GRID: Record<number, [cols: number, rows: number]> = {
  6: [3, 2],
  8: [4, 2],
  10: [5, 2],
  12: [4, 3],
  14: [7, 2],
  16: [4, 4],
  18: [6, 3],
  20: [5, 4],
};

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Card {
  key: string;
  motif: Motif;
}

function deal(pairs: number): Card[] {
  const chosen = shuffled(MOTIFS).slice(0, pairs);
  return shuffled(chosen.flatMap((m) => [{ key: `${m}-a`, motif: m }, { key: `${m}-b`, motif: m }]));
}

export default function MemoryPairsGame({ band, theme, sound, save, award, reduceMotion }: GameProps) {
  const startingPairs = band === 'star' ? 6 : 4;
  const [pairs, setPairs] = useState(startingPairs);
  const [cards, setCards] = useState<Card[]>(() => deal(startingPairs));
  const [faceUp, setFaceUp] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [box, setBox] = useState({ w: 900, h: 600 });
  const host = useRef<HTMLDivElement>(null);
  const flips = useRef(0);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const melody = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  // Pick up where she left off, so the board doesn't reset to easy every visit.
  useEffect(() => {
    let live = true;
    void save.load<Save>().then((d) => {
      if (!live || !d?.pairs) return;
      const p = Math.min(MAX_PAIRS, Math.max(MIN_PAIRS, d.pairs));
      setPairs(p);
      setCards(deal(p));
      setFaceUp([]);
      setMatched(new Set());
      flips.current = 0;
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

  const [cols, rows] = GRID[cards.length] ?? [Math.ceil(Math.sqrt(cards.length * 1.6)), 3];
  const gap = 14;
  const size = useMemo(() => {
    const w = (box.w - gap * (cols + 1)) / cols;
    const h = (box.h - gap * (rows + 1)) / rows;
    return Math.max(64, Math.floor(Math.min(w, h)));
  }, [box, cols, rows]);

  function newRound(nextPairs: number) {
    setCards(deal(nextPairs));
    setFaceUp([]);
    setMatched(new Set());
    flips.current = 0;
    busy.current = false;
  }

  /**
   * The whole adaptive rule. `extra` is how many flips beyond the perfect
   * minimum the round took; a round is "easy" if she wasted fewer flips than
   * there were pairs. Deliberately gentle — one step at a time, either way.
   */
  function reconsider(): number {
    const extra = flips.current - pairs * 2;
    let next = pairs;
    if (extra <= pairs) next = Math.min(MAX_PAIRS, pairs + 1);
    else if (extra > pairs * 3) next = Math.max(MIN_PAIRS, pairs - 1);
    if (next !== pairs) {
      setPairs(next);
      save.put<Save>({ pairs: next });
    }
    return next;
  }

  function flip(card: Card) {
    if (busy.current || matched.has(card.key) || faceUp.includes(card.key)) return;
    flips.current += 1;
    melody.current = (melody.current + 1) % 8;
    sound.blip(melody.current);

    const next = [...faceUp, card.key];
    setFaceUp(next);
    if (next.length < 2) return;

    const [aKey, bKey] = next;
    const a = cards.find((c) => c.key === aKey)!;
    const b = cards.find((c) => c.key === bKey)!;
    busy.current = true;

    if (a.motif === b.motif) {
      after(420, () => {
        setMatched((m) => new Set(m).add(aKey).add(bKey));
        setFaceUp([]);
        busy.current = false;
        sound.chime(4);
        award(`memory-pairs:${a.motif}`);

        if (matched.size + 2 >= cards.length) {
          // Board finished. A little run of notes, then a fresh one.
          for (let i = 0; i < 5; i++) after(300 + i * 120, () => sound.chime(i + 2));
          const nextPairs = reconsider();
          after(1500, () => newRound(nextPairs));
        }
      });
    } else {
      // Not a pair. They turn back over, and that is all that happens.
      after(1000, () => {
        setFaceUp([]);
        busy.current = false;
      });
    }
  }

  return (
    <div
      className="h-full w-full pl-[var(--cc-rail)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[300]})` }}
    >
      <div ref={host} className="flex h-full w-full flex-wrap content-center items-center justify-center" style={{ gap }}>
        {cards.map((card) => {
          const isUp = faceUp.includes(card.key) || matched.has(card.key);
          const isMatched = matched.has(card.key);
          return (
            <button
              key={card.key}
              onPointerDown={() => flip(card)}
              aria-label={isUp ? card.motif : 'card'}
              className="shrink-0"
              style={{ width: size, height: size, perspective: 900, opacity: isMatched ? 0.55 : 1, transition: 'opacity 400ms ease' }}
            >
              <span
                className="relative block h-full w-full"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: reduceMotion ? undefined : `rotateY(${isUp ? 180 : 0}deg)`,
                  transition: reduceMotion ? undefined : 'transform 420ms cubic-bezier(0.3,0.8,0.4,1)',
                }}
              >
                {/* back */}
                <span
                  className="absolute inset-0 grid place-items-center rounded-cozy"
                  style={{
                    backfaceVisibility: 'hidden',
                    opacity: reduceMotion && isUp ? 0 : 1,
                    background: `linear-gradient(140deg, ${theme.scale[400]}, ${theme.scale[600]})`,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                  }}
                >
                  <span
                    className="rounded-full"
                    style={{ width: size * 0.3, height: size * 0.3, border: `${Math.max(3, size * 0.04)}px solid rgba(255,255,255,0.5)` }}
                  />
                </span>
                {/* front */}
                <span
                  className="absolute inset-0 grid place-items-center rounded-cozy bg-white"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: reduceMotion ? undefined : 'rotateY(180deg)',
                    opacity: reduceMotion && !isUp ? 0 : 1,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                  }}
                >
                  <MotifSVG motif={card.motif} size={size * 0.74} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
