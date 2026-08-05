import type { FC } from 'react';

/**
 * Ten things to find twice, drawn fresh for this game.
 *
 * They have to be told apart at a glance and from across a table, so each one
 * is a different colour AND a different silhouette — never two round yellow
 * things. That way remembering "the red one on the left" is enough, which is
 * the whole skill being practised.
 */

export type Motif =
  | 'sun' | 'moon' | 'rainbow' | 'cloud' | 'flower'
  | 'leaf' | 'apple' | 'cherry' | 'butterfly' | 'ladybird';

export const MOTIFS: Motif[] = [
  'sun', 'moon', 'rainbow', 'cloud', 'flower',
  'leaf', 'apple', 'cherry', 'butterfly', 'ladybird',
];

export const MOTIF_NAME: Record<Motif, string> = {
  sun: 'Sun',
  moon: 'Moon',
  rainbow: 'Rainbow',
  cloud: 'Cloud',
  flower: 'Flower',
  leaf: 'Leaf',
  apple: 'Apple',
  cherry: 'Cherries',
  butterfly: 'Butterfly',
  ladybird: 'Ladybird',
};

export const MotifSVG: FC<{ motif: Motif; size?: number; className?: string }> = ({
  motif,
  size = 100,
  className,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
    {motif === 'sun' && (
      <g>
        {[...Array(8)].map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * 30}
              y1={50 + Math.sin(a) * 30}
              x2={50 + Math.cos(a) * 44}
              y2={50 + Math.sin(a) * 44}
              stroke="#F4B93C"
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="50" cy="50" r="26" fill="#FBD75B" stroke="#E0B02F" strokeWidth="3" />
      </g>
    )}

    {motif === 'moon' && (
      <g>
        <path d="M64 12 A 40 40 0 1 0 64 88 A 32 32 0 1 1 64 12 Z" fill="#EFE6C4" stroke="#CBBE92" strokeWidth="3" />
        <circle cx="40" cy="34" r="5" fill="#DBCFA3" />
        <circle cx="32" cy="56" r="7" fill="#DBCFA3" />
        <circle cx="46" cy="70" r="4" fill="#DBCFA3" />
      </g>
    )}

    {motif === 'rainbow' && (
      <g fill="none" strokeWidth="9" strokeLinecap="round">
        <path d="M12 76 A 38 38 0 0 1 88 76" stroke="#EE7D7D" />
        <path d="M23 76 A 27 27 0 0 1 77 76" stroke="#F4C04A" />
        <path d="M34 76 A 16 16 0 0 1 66 76" stroke="#6FBE72" />
      </g>
    )}

    {motif === 'cloud' && (
      <g fill="#BFDCF2" stroke="#8FB9DA" strokeWidth="3">
        <circle cx="34" cy="54" r="18" />
        <circle cx="58" cy="44" r="23" />
        <circle cx="74" cy="58" r="15" />
        <rect x="28" y="56" width="52" height="20" rx="10" stroke="none" />
      </g>
    )}

    {motif === 'flower' && (
      <g>
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <ellipse
              key={i}
              cx={50 + Math.cos(a) * 22}
              cy={50 + Math.sin(a) * 22}
              rx="15"
              ry="11"
              transform={`rotate(${(i / 6) * 360} ${50 + Math.cos(a) * 22} ${50 + Math.sin(a) * 22})`}
              fill="#E98FC0"
              stroke="#CB6DA1"
              strokeWidth="2.5"
            />
          );
        })}
        <circle cx="50" cy="50" r="13" fill="#F8DC6A" stroke="#DCB93C" strokeWidth="2.5" />
      </g>
    )}

    {motif === 'leaf' && (
      <g>
        <path d="M50 88 C 14 66 14 26 50 10 C 86 26 86 66 50 88 Z" fill="#7FC46C" stroke="#5C9E4C" strokeWidth="3" />
        <path d="M50 84 L50 18" stroke="#5C9E4C" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M50 40 L32 30 M50 54 L34 46 M50 40 L68 30 M50 54 L66 46" stroke="#5C9E4C" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    )}

    {motif === 'apple' && (
      <g>
        <path d="M50 26 C 34 14 12 26 16 50 C 20 74 38 92 50 92 C 62 92 80 74 84 50 C 88 26 66 14 50 26 Z" fill="#E4635F" stroke="#BE4844" strokeWidth="3" />
        <path d="M50 28 L50 12" stroke="#7A5233" strokeWidth="5" strokeLinecap="round" />
        <path d="M52 16 C 66 6 78 12 74 22 C 68 30 56 26 52 16 Z" fill="#7FC46C" stroke="#5C9E4C" strokeWidth="2.5" />
      </g>
    )}

    {motif === 'cherry' && (
      <g>
        <path d="M50 14 C 34 30 28 46 30 58 M50 14 C 64 30 70 46 70 58" fill="none" stroke="#6E9A4E" strokeWidth="5" strokeLinecap="round" />
        <path d="M44 16 C 52 6 62 8 66 16 C 58 20 50 20 44 16 Z" fill="#7FC46C" stroke="#5C9E4C" strokeWidth="2.5" />
        <circle cx="30" cy="70" r="17" fill="#D8425C" stroke="#B22E45" strokeWidth="3" />
        <circle cx="70" cy="70" r="17" fill="#D8425C" stroke="#B22E45" strokeWidth="3" />
        <circle cx="25" cy="65" r="4" fill="#FFFFFF" opacity="0.6" />
        <circle cx="65" cy="65" r="4" fill="#FFFFFF" opacity="0.6" />
      </g>
    )}

    {motif === 'butterfly' && (
      <g>
        <path d="M48 50 C 30 22 6 26 10 46 C 13 62 34 62 48 50 Z" fill="#9B8AE0" stroke="#7A69C4" strokeWidth="3" />
        <path d="M52 50 C 70 22 94 26 90 46 C 87 62 66 62 52 50 Z" fill="#9B8AE0" stroke="#7A69C4" strokeWidth="3" />
        <path d="M48 52 C 34 66 20 84 34 90 C 46 94 50 70 48 52 Z" fill="#B7A9EC" stroke="#7A69C4" strokeWidth="3" />
        <path d="M52 52 C 66 66 80 84 66 90 C 54 94 50 70 52 52 Z" fill="#B7A9EC" stroke="#7A69C4" strokeWidth="3" />
        <rect x="46" y="34" width="8" height="52" rx="4" fill="#4C4066" />
        <path d="M48 34 L38 18 M52 34 L62 18" stroke="#4C4066" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    )}

    {motif === 'ladybird' && (
      <g>
        <circle cx="50" cy="58" r="34" fill="#E4514F" stroke="#B93A38" strokeWidth="3" />
        <path d="M50 24 A 34 34 0 0 0 50 92 Z" fill="#D14442" />
        <circle cx="50" cy="30" r="15" fill="#3A3340" />
        <path d="M50 24 L50 92" stroke="#3A3340" strokeWidth="3.5" />
        <circle cx="33" cy="52" r="6.5" fill="#3A3340" />
        <circle cx="67" cy="52" r="6.5" fill="#3A3340" />
        <circle cx="38" cy="74" r="5.5" fill="#3A3340" />
        <circle cx="62" cy="74" r="5.5" fill="#3A3340" />
        <path d="M42 18 L34 8 M58 18 L66 8" stroke="#3A3340" strokeWidth="3.4" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
