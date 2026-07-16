import { useId } from 'react';
import { FILLING, SPONGE, type Cake } from './types';

/**
 * Renders a cake's silhouette (base shape, frosting, piping, sprinkles, and the
 * cut slice) as an SVG that fills its container. Toppers are drawn as an overlay
 * by the parent so they can be dragged. Reused for the editor and the shelf.
 *
 * Piping and sprinkles are keyed by their color, so choosing a new one re-runs
 * their entrance: the piping pipes itself on again, the sprinkles rain down again.
 * `animate={false}` renders them settled (used for thumbnails and the frosting
 * spread overlay, which would otherwise double up).
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shift(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.min(255, Math.max(0, v + amt));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const SPRINKLE_COLORS = ['#EF7DA0', '#F6C948', '#8FD6C6', '#A9C9F0'];

function rimDots(x0: number, x1: number, y: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, y]);
  return out;
}

const CUT_TOP: Record<Cake['base'], number> = { round: 150, tall: 110, heart: 128, square: 142 };

export function CakeView({ cake, animate = true }: { cake: Cake; animate?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const f = cake.frosting;
  const top = shift(f, 22);

  let body: React.ReactNode = null;
  let sprinkleRegion: [number, number, number, number] = [80, 150, 140, 80];
  let piping: [number, number][] = [];

  if (cake.base === 'round') {
    body = (
      <g>
        <path d="M54 162 Q54 150 66 150 H234 Q246 150 246 162 V236 Q246 250 232 250 H68 Q54 250 54 236 Z" fill={f} />
        <ellipse cx="150" cy="150" rx="96" ry="24" fill={top} />
      </g>
    );
    sprinkleRegion = [72, 158, 156, 76];
    piping = [...rimDots(60, 240, 152, 9), ...rimDots(62, 238, 248, 9)];
  } else if (cake.base === 'tall') {
    body = (
      <g>
        <path d="M66 172 Q66 162 78 162 H222 Q234 162 234 172 V240 Q234 252 220 252 H80 Q66 252 66 240 Z" fill={f} />
        <ellipse cx="150" cy="162" rx="84" ry="20" fill={shift(f, 10)} />
        <path d="M92 120 Q92 110 104 110 H196 Q208 110 208 120 V158 H92 Z" fill={f} />
        <ellipse cx="150" cy="110" rx="58" ry="16" fill={top} />
      </g>
    );
    sprinkleRegion = [100, 116, 100, 40];
    piping = [...rimDots(96, 204, 112, 7), ...rimDots(72, 228, 250, 9)];
  } else if (cake.base === 'heart') {
    body = (
      <path
        d="M150 250 C 60 190 60 110 100 96 C 132 84 150 112 150 128 C 150 112 168 84 200 96 C 240 110 240 190 150 250 Z"
        fill={f}
      />
    );
    sprinkleRegion = [96, 120, 108, 70];
    piping = rimDots(104, 196, 104, 6);
  } else {
    body = (
      <g>
        <path d="M64 168 L150 140 L236 168 V236 Q236 250 222 250 H78 Q64 250 64 236 Z" fill={f} />
        <path d="M64 168 L150 140 L236 168 L150 196 Z" fill={top} />
      </g>
    );
    sprinkleRegion = [90, 156, 120, 40];
    piping = rimDots(70, 230, 246, 9);
  }

  const cutTop = CUT_TOP[cake.base];
  const cutPath = `M150 ${cutTop + 4} L122 250 L178 250 Z`;

  const layers: React.ReactNode[] = [];
  {
    let y = cutTop + 4;
    let i = 0;
    while (y < 252) {
      const h = i % 2 === 0 ? 26 : 11;
      layers.push(<rect key={i} x="88" y={y} width="124" height={h} fill={i % 2 === 0 ? SPONGE : FILLING} />);
      y += h;
      i++;
    }
  }

  const sprinkles = (() => {
    if (!cake.sprinkles) return null;
    const [x, y, w, h] = sprinkleRegion;
    const rnd = mulberry32(1337);
    return (
      <g key={cake.sprinkles}>
        {Array.from({ length: 26 }, (_, i) => {
          const cx = x + rnd() * w;
          const cy = y + rnd() * h;
          const rot = rnd() * 180;
          const c = cake.sprinkles === 'rainbow' ? SPRINKLE_COLORS[i % 4] : cake.sprinkles!;
          return (
            <g
              key={i}
              className={animate ? 'cc-sprinkle' : undefined}
              style={animate ? { animationDelay: `${i * 18}ms` } : undefined}
            >
              <rect x={cx - 4} y={cy - 1.6} width="8" height="3.2" rx="1.6" fill={c} transform={`rotate(${rot} ${cx} ${cy})`} />
            </g>
          );
        })}
      </g>
    );
  })();

  const pipingDots =
    cake.piping && piping.length > 0 ? (
      <g key={cake.piping}>
        {piping.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="6"
            fill={cake.piping!}
            stroke="#00000010"
            className={animate ? 'cc-pip' : undefined}
            style={animate ? { animationDelay: `${i * 45}ms` } : undefined}
          />
        ))}
      </g>
    ) : null;

  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" style={{ overflow: 'visible' }}>
      <defs>
        <mask id={`cut${uid}`}>
          <rect x="0" y="0" width="300" height="300" fill="white" />
          {cake.cut && <path d={cutPath} fill="black" />}
        </mask>
        <clipPath id={`clip${uid}`}>
          <path d={cutPath} />
        </clipPath>
      </defs>

      <ellipse cx="150" cy="262" rx="126" ry="16" fill="#EBE2D8" />
      <ellipse cx="150" cy="258" rx="126" ry="12" fill="#F6EFE6" />

      <g mask={cake.cut ? `url(#cut${uid})` : undefined}>
        {body}
        {sprinkles}
        {pipingDots}
      </g>

      {cake.cut && (
        <g>
          <g clipPath={`url(#clip${uid})`}>{layers}</g>
          <path d={cutPath} fill="none" stroke={shift(f, -40)} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
