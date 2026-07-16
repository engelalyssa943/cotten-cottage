import type { Cake } from './types';

/**
 * Renders a cake's silhouette (base shape, frosting, piping, sprinkles) as an SVG
 * that fills its container. Toppers are drawn as an overlay by the parent so they
 * can be dragged. Reused for both the editor and the bakery-shelf thumbnails.
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

function lighten(hex: string, amt = 26): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function Sprinkles({ color, region }: { color: string; region: [number, number, number, number] }) {
  const [x, y, w, h] = region;
  const rnd = mulberry32(1337);
  const dots = Array.from({ length: 26 }, (_, i) => {
    const cx = x + rnd() * w;
    const cy = y + rnd() * h;
    const rot = rnd() * 180;
    const c = color === 'rainbow' ? ['#EF7DA0', '#F6C948', '#8FD6C6', '#A9C9F0'][i % 4] : color;
    return <rect key={i} x={cx - 4} y={cy - 1.6} width="8" height="3.2" rx="1.6" fill={c} transform={`rotate(${rot} ${cx} ${cy})`} />;
  });
  return <g>{dots}</g>;
}

function Piping({ color, points }: { color: string; points: [number, number][] }) {
  return (
    <g>
      {points.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="6" fill={color} stroke="#00000010" />
      ))}
    </g>
  );
}

function rimDots(x0: number, x1: number, y: number, n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, y]);
  return out;
}

export function CakeView({ cake }: { cake: Cake }) {
  const f = cake.frosting;
  const top = lighten(f, 22);

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
        <ellipse cx="150" cy="162" rx="84" ry="20" fill={lighten(f, 10)} />
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
    piping = [];
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

  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" style={{ overflow: 'visible' }}>
      <ellipse cx="150" cy="262" rx="126" ry="16" fill="#EBE2D8" />
      <ellipse cx="150" cy="258" rx="126" ry="12" fill="#F6EFE6" />
      {body}
      {cake.sprinkles && <Sprinkles color={cake.sprinkles} region={sprinkleRegion} />}
      {cake.piping && piping.length > 0 && <Piping color={cake.piping} points={piping} />}
    </svg>
  );
}
