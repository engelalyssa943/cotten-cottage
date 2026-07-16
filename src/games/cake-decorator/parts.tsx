import type { FC } from 'react';

export type Topper = 'star' | 'heart' | 'bow' | 'strawberry' | 'flower' | 'candle';

export const TOPPERS: Topper[] = ['star', 'heart', 'bow', 'strawberry', 'flower', 'candle'];

/** A cake topper, centered, as a standalone SVG (used on the cake and in the tray). */
export const TopperSVG: FC<{ kind: Topper; size?: number; className?: string }> = ({
  kind,
  size = 60,
  className,
}) => {
  const common = { width: size, height: size, className, style: { overflow: 'visible' as const } };
  switch (kind) {
    case 'star':
      return (
        <svg viewBox="-32 -32 64 64" {...common}>
          <path d="M0 -28 L8 -8 L30 -6 L13 8 L18 30 L0 18 L-18 30 L-13 8 L-30 -6 L-8 -8 Z" fill="#F6C948" stroke="#E0A93A" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="-32 -32 64 64" {...common}>
          <path d="M0 24 C -30 2 -26 -26 -8 -26 C -1 -26 0 -18 0 -14 C 0 -18 1 -26 8 -26 C 26 -26 30 2 0 24 Z" fill="#EF7DA0" stroke="#DB5F86" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'bow':
      return (
        <svg viewBox="-34 -24 68 48" {...common}>
          <path d="M-4 0 L-30 -16 Q -34 0 -30 16 Z" fill="#F49AC1" />
          <path d="M4 0 L30 -16 Q 34 0 30 16 Z" fill="#F49AC1" />
          <circle cx="0" cy="0" r="8" fill="#E27AA6" />
        </svg>
      );
    case 'strawberry':
      return (
        <svg viewBox="-26 -30 52 64" {...common}>
          <path d="M0 30 C -22 20 -22 -6 0 -8 C 22 -6 22 20 0 30 Z" fill="#E4585E" />
          <path d="M-14 -8 L0 -18 L14 -8 Q 0 -2 -14 -8 Z" fill="#6FBE6E" />
          {[[-8, 2], [6, 4], [-2, 12], [10, 14], [-12, 16]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" fill="#FCE59A" />
          ))}
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="-30 -30 60 60" {...common}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 15} cy={Math.sin((a * Math.PI) / 180) * 15} r="11" fill="#F7B4CE" />
          ))}
          <circle cx="0" cy="0" r="9" fill="#F6C948" />
        </svg>
      );
    case 'candle':
      return (
        <svg viewBox="-14 -40 28 72" {...common}>
          <rect x="-6" y="-8" width="12" height="40" rx="4" fill="#8FC7E8" />
          <rect x="-6" y="-8" width="4" height="40" rx="2" fill="#B7DEF3" opacity="0.7" />
          <path d="M0 -30 C 7 -22 6 -12 0 -12 C -6 -12 -7 -22 0 -30 Z" fill="#F6A64F" />
          <path d="M0 -26 C 3 -21 3 -15 0 -15 C -3 -15 -3 -21 0 -26 Z" fill="#F6C948" />
        </svg>
      );
  }
};
