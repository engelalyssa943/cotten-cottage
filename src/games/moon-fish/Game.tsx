import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { SCENES } from './scenes';

/**
 * Aunt Alyssa's door: a six-screen tap-through about a small rocket that goes to
 * visit a fish on the moon.
 *
 * One interaction per screen and the interaction is "touch it anywhere", which is
 * the only control a one-year-old and a five-year-old genuinely share. Nothing
 * can be mistimed or missed; the last screen loops gently back to the first, so a
 * child who wants it four times in a row gets it four times in a row.
 */

/** How long each screen's one moment of movement takes. */
const BEAT_MS = 900;

export default function MoonFishGame({ profile, band, theme, sound, award, reduceMotion }: GameProps) {
  const [i, setI] = useState(0);
  const [beat, setBeat] = useState(0);
  const raf = useRef(0);
  const busy = useRef(false);

  // The star at the end is given the first time they reach it, and quietly
  // re-given never — award() is idempotent, so looping costs nothing.
  useEffect(() => {
    if (i === SCENES.length - 1) award('moon-fish:moon-star');
  }, [i, award]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  function advance() {
    if (busy.current) return;
    busy.current = true;

    const last = i === SCENES.length - 1;
    sound.chime(i);
    if (!last) sound.blip(i + 2);

    const go = () => {
      setBeat(0);
      setI((n) => (n + 1) % SCENES.length);
      busy.current = false;
    };

    if (reduceMotion) {
      // No travelling shot: the scene simply changes.
      go();
      return;
    }

    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / BEAT_MS);
      setBeat(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else go();
    };
    raf.current = requestAnimationFrame(tick);
  }

  const Scene = SCENES[i];
  // The littlest gets a slightly closer view, so faces and the fish read bigger.
  const zoom = band === 'sprout' ? 1.08 : 1;

  return (
    <button
      onPointerDown={advance}
      className="block h-full w-full touch-none"
      style={{ background: '#221F4B' }}
      aria-label="Keep going"
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ transform: `scale(${zoom})` }}
        aria-hidden
      >
        <Scene
          beat={beat}
          reduceMotion={reduceMotion}
          accent={theme.favorite}
          accentDeep={theme.paintDeep}
          name={profile.name}
        />
      </svg>
    </button>
  );
}
