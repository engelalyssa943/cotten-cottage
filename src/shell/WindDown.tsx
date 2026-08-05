import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';
import { useHold } from './useHold';

/**
 * The end of a session, made to feel like the end of a story rather than a
 * device being taken away.
 *
 * Two phases: the pond at dusk, where the light goes down and the ripples get
 * slower and further apart, and then the star field. Nothing here is
 * interactive — there is nothing to finish, nothing to lose, and no button that
 * says stop. A grown-up can hold the corner to come back out.
 *
 * The pond is drawn here rather than by mounting `calm-pond`: the shell never
 * names a game id, or the cottage would stop being a thing you can add games to.
 */

const POND_MS = 120_000; // two minutes of dusk, then the stars

const RIPPLES = [
  { x: 34, y: 62, delay: 0 },
  { x: 68, y: 48, delay: 5 },
  { x: 52, y: 74, delay: 11 },
  { x: 22, y: 40, delay: 17 },
  { x: 80, y: 68, delay: 23 },
];

const STARS = [...Array(46)].map((_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: i % 3 ? 2 : 3,
  twinkle: 2.4 + (i % 5) * 0.7,
  delay: (i % 7) * 0.4,
}));

export function WindDown() {
  const reset = useApp((s) => s.reset);
  const reduceMotion = useApp((s) => s.reduceMotion);
  const [phase, setPhase] = useState<'pond' | 'stars'>('stars');
  const { progress, bind } = useHold(() => reset({ kind: 'profiles' }), 2000);
  const raf = useRef(0);

  // Drift from pond to stars off the frame clock — a fade, not a countdown.
  useEffect(() => {
    setPhase('pond');
    const t0 = performance.now();
    const tick = (t: number) => {
      if (t - t0 >= POND_MS) {
        setPhase('stars');
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: '#20233F' }}>
      {/* the pond at dusk, fading away as the stars come up */}
      <div
        className="absolute inset-0"
        style={{
          opacity: phase === 'pond' ? 1 : 0,
          transition: reduceMotion ? 'opacity 1.2s linear' : 'opacity 6s ease-in-out',
        }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="cc-wd-dusk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6E5A8E" />
              <stop offset="0.5" stopColor="#4A5A82" />
              <stop offset="1" stopColor="#2A3A5C" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#cc-wd-dusk)" />
          {!reduceMotion &&
            RIPPLES.map((r, i) => (
              <circle key={i} cx={r.x} cy={r.y} r="1" fill="none" stroke="#FFFFFF" strokeWidth="0.3">
                <animate attributeName="r" values="1;16" dur="9s" begin={`${r.delay}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="9s" begin={`${r.delay}s`} repeatCount="indefinite" />
              </circle>
            ))}
          {/* a lily, settling for the night */}
          <ellipse cx="72" cy="80" rx="9" ry="4.5" fill="#3E6B58" opacity="0.85" />
          <ellipse cx="28" cy="88" rx="7" ry="3.6" fill="#37604F" opacity="0.8" />
        </svg>
      </div>

      {/* the star field */}
      <div
        className="absolute inset-0"
        style={{
          opacity: phase === 'stars' ? 1 : 0,
          transition: reduceMotion ? 'opacity 1.2s linear' : 'opacity 6s ease-in-out',
        }}
      >
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: 0.5,
              animation: reduceMotion ? undefined : `cc-twinkle ${s.twinkle}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
        <div className="grid h-full w-full place-items-center">
          <div className="text-2xl text-white/80">see you soon ✨</div>
        </div>
      </div>

      {/* grown-up escape hatch, invisible to a child who isn't looking for it */}
      <div
        {...bind}
        className="absolute bottom-0 right-0 h-24 w-24"
        style={{ touchAction: 'none' }}
        aria-label="Wake"
        role="button"
      >
        {progress > 0 && (
          <div
            className="absolute bottom-6 right-6 h-6 w-6 rounded-full border-2 border-white/60"
            style={{ opacity: progress }}
          />
        )}
      </div>
    </div>
  );
}
