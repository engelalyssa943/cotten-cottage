import type { FC } from 'react';

// All aquarium art is inline SVG — no image files. Each piece is a standalone
// <svg> so it can be used in the tank, the decoration tray, and the Collection Book.

export type Species =
  | 'clownfish'
  | 'tang'
  | 'sunny'
  | 'angelfish'
  | 'seahorse'
  | 'jelly'
  | 'goldie';

export type DecorKind = 'plant' | 'rock' | 'castle' | 'chest';

const FISH_COLORS: Record<Species, { body: string; fin: string; belly: string }> = {
  clownfish: { body: '#F6934A', fin: '#EA7A2E', belly: '#FFE7CE' },
  tang: { body: '#4FA3DE', fin: '#357FC0', belly: '#DCEEFB' },
  sunny: { body: '#F4C64B', fin: '#E3AE2C', belly: '#FFF3CC' },
  angelfish: { body: '#C79BE6', fin: '#A874D6', belly: '#F0E4FA' },
  seahorse: { body: '#F49CC0', fin: '#E27AA6', belly: '#FBDCE9' },
  jelly: { body: '#F2A9D6', fin: '#E483C0', belly: '#FCE2F1' },
  goldie: { body: '#F5A64F', fin: '#E88B2E', belly: '#FFE9CE' },
};

/** A fish facing LEFT (head at -x). Flip horizontally to swim right. */
export const FishSVG: FC<{ species: Species; size?: number; className?: string }> = ({
  species,
  size = 120,
  className,
}) => {
  const c = FISH_COLORS[species];
  if (species === 'seahorse') {
    return (
      <svg viewBox="-70 -60 140 120" width={size} height={size} className={className} style={{ overflow: 'visible' }}>
        <path d="M-6 -46 q -26 6 -22 34 q 3 22 -10 34 q -16 12 -2 22 q 8 5 12 -6 q 6 -18 2 -30 q -3 -20 14 -30 q 20 -12 14 -30 q -8 -12 -20 6 Z" fill={c.body} />
        <path d="M-2 -46 q 14 -12 22 -2 q -8 6 -18 8 Z" fill={c.fin} />
        <circle cx="-6" cy="-34" r="4" fill="#2a2a2a" />
      </svg>
    );
  }
  if (species === 'jelly') {
    return (
      <svg viewBox="-60 -55 120 120" width={size} height={size} className={className} style={{ overflow: 'visible' }}>
        <path d="M-40 0 q 0 -46 40 -46 q 40 0 40 46 q -20 -12 -40 0 q -20 -12 -40 0 Z" fill={c.body} opacity="0.9" />
        {[-26, -10, 6, 22].map((x, i) => (
          <path key={i} d={`M${x} 0 q 6 24 -2 44`} stroke={c.fin} strokeWidth="5" fill="none" strokeLinecap="round" />
        ))}
        <circle cx="-12" cy="-14" r="4" fill="#ffffff" />
        <circle cx="12" cy="-14" r="4" fill="#ffffff" />
      </svg>
    );
  }
  const stripes = species === 'clownfish';
  return (
    <svg viewBox="-70 -50 140 100" width={size} height={size} className={className} style={{ overflow: 'visible' }}>
      <path d="M34 0 L66 -26 L66 26 Z" fill={c.fin} />
      <path d="M-6 -24 Q 12 -40 30 -18 Z" fill={c.fin} opacity="0.95" />
      <path d="M-6 24 Q 10 36 26 20 Z" fill={c.fin} opacity="0.8" />
      <ellipse cx="0" cy="0" rx="42" ry="30" fill={c.body} />
      <ellipse cx="-8" cy="8" rx="28" ry="16" fill={c.belly} opacity="0.55" />
      {stripes && (
        <g fill="#ffffff" opacity="0.85">
          <path d="M-18 -26 q 8 26 0 52 q -12 -4 -14 -26 q 2 -22 14 -26 Z" />
          <path d="M6 -28 q 10 28 0 56 q -8 -3 -8 -28 q 0 -25 8 -28 Z" />
        </g>
      )}
      <circle cx="-24" cy="-6" r="7" fill="#ffffff" />
      <circle cx="-25" cy="-6" r="4" fill="#2a2a2a" />
    </svg>
  );
};

export const DecorSVG: FC<{ kind: DecorKind; size?: number; className?: string }> = ({
  kind,
  size = 120,
  className,
}) => {
  if (kind === 'plant') {
    return (
      <svg viewBox="0 0 120 140" width={size} height={size * 140 / 120} className={className} style={{ overflow: 'visible' }}>
        <path d="M60 140 q -34 -30 -22 -78 q 6 -26 22 -34 q -6 30 4 54 q 8 20 -4 58 Z" fill="#78C06F" />
        <path d="M60 140 q 30 -34 22 -80 q -4 -24 -18 -34 q 4 30 -6 56 q -6 20 2 58 Z" fill="#8FCE86" />
        <path d="M60 140 q -6 -40 0 -84 q 4 -14 10 -18 q -2 30 -2 54 q 0 24 -8 48 Z" fill="#69B25F" />
      </svg>
    );
  }
  if (kind === 'rock') {
    return (
      <svg viewBox="0 0 120 90" width={size} height={size * 90 / 120} className={className} style={{ overflow: 'visible' }}>
        <path d="M6 84 Q 0 44 34 34 Q 44 12 74 22 Q 116 26 112 62 Q 116 84 96 86 Z" fill="#9AA6AE" />
        <path d="M30 84 Q 26 60 46 52 Q 60 46 66 60 Q 70 78 58 84 Z" fill="#B4BEC5" opacity="0.7" />
      </svg>
    );
  }
  if (kind === 'castle') {
    return (
      <svg viewBox="0 0 140 150" width={size} height={size * 150 / 140} className={className} style={{ overflow: 'visible' }}>
        <rect x="22" y="60" width="96" height="80" rx="10" fill="#EBD9C2" />
        <rect x="16" y="34" width="26" height="106" rx="8" fill="#E2CBAE" />
        <rect x="98" y="34" width="26" height="106" rx="8" fill="#E2CBAE" />
        <path d="M16 34 l13 -20 l13 20 Z" fill="#F19AC0" />
        <path d="M98 34 l13 -20 l13 20 Z" fill="#F19AC0" />
        <path d="M56 60 l14 -22 l14 22 Z" fill="#F19AC0" />
        <rect x="60" y="96" width="20" height="44" rx="10" fill="#B98A63" />
        <circle cx="70" cy="82" r="8" fill="#BFD9EA" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 130 100" width={size} height={size * 100 / 130} className={className} style={{ overflow: 'visible' }}>
      <rect x="14" y="46" width="102" height="46" rx="10" fill="#B9895B" />
      <path d="M14 52 q 0 -30 51 -30 q 51 0 51 30 Z" fill="#CE9A67" />
      <rect x="10" y="52" width="110" height="12" rx="6" fill="#8C6239" />
      <rect x="58" y="60" width="14" height="18" rx="4" fill="#F2C94C" />
      <circle cx="65" cy="34" r="7" fill="#FCE59A" />
      <circle cx="52" cy="30" r="4" fill="#FCE59A" opacity="0.8" />
      <circle cx="80" cy="32" r="4" fill="#FCE59A" opacity="0.8" />
    </svg>
  );
};
