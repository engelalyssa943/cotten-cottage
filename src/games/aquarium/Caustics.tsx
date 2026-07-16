/**
 * Dappled light on the water.
 *
 * Deliberately cheap. Two things this does NOT do:
 *  - animated feTurbulence (re-rasterises every frame — stutters on a tablet)
 *  - CSS blur() filters (the gradients are already soft; blurring 11 full-screen
 *    elements every frame buys nothing and costs a lot)
 * What's left is a handful of soft-edged gradients moving on GPU-composited
 * transforms under one `screen` blend, which reads as caustics for almost free.
 */

const BLOBS = [
  { x: '8%', y: '14%', s: 240, d: 17, delay: 0, k: 'cc-drift-a' },
  { x: '36%', y: '6%', s: 320, d: 23, delay: -6, k: 'cc-drift-b' },
  { x: '64%', y: '18%', s: 210, d: 19, delay: -3, k: 'cc-drift-a' },
  { x: '88%', y: '10%', s: 280, d: 26, delay: -11, k: 'cc-drift-b' },
  { x: '18%', y: '52%', s: 260, d: 21, delay: -8, k: 'cc-drift-b' },
  { x: '54%', y: '48%', s: 220, d: 15, delay: -2, k: 'cc-drift-a' },
  { x: '80%', y: '58%', s: 300, d: 24, delay: -14, k: 'cc-drift-b' },
];

const SHAFTS = [
  { x: '14%', w: 190, d: 26, delay: 0 },
  { x: '48%', w: 150, d: 31, delay: -9 },
  { x: '76%', w: 210, d: 22, delay: -15 },
];

export function Caustics({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ mixBlendMode: 'screen' }}>
      {SHAFTS.map((s, i) => (
        <div
          key={`s${i}`}
          className="absolute top-0"
          style={{
            left: s.x,
            width: s.w,
            height: '80%',
            // Soft on all edges from the gradient itself — no blur filter needed.
            background:
              'radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0) 72%)',
            transformOrigin: 'top center',
            willChange: reduceMotion ? undefined : 'transform',
            animation: reduceMotion ? undefined : `cc-shaft ${s.d}s ease-in-out ${s.delay}s infinite alternate`,
          }}
        />
      ))}
      {BLOBS.map((b, i) => (
        <div
          key={`b${i}`}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s * 0.5,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0) 72%)',
            willChange: reduceMotion ? undefined : 'transform',
            animation: reduceMotion ? undefined : `${b.k} ${b.d}s ease-in-out ${b.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
