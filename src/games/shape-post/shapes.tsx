import type { FC } from 'react';

/**
 * Five shapes, each with a face, and the same five as holes cut in a lid.
 *
 * The hole and the shape are literally the same path — the hole is the shape
 * drawn dark and slightly larger. That is the whole idea a shape sorter
 * teaches, so it seemed right that the code says it too.
 */

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'star' | 'heart';

export const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'star', 'heart'];

export const SHAPE_NAME: Record<ShapeKind, string> = {
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  star: 'Star',
  heart: 'Heart',
};

const COLOR: Record<ShapeKind, { fill: string; edge: string }> = {
  circle: { fill: '#F2913F', edge: '#D2762A' },
  square: { fill: '#5FAEE0', edge: '#3F8CBE' },
  triangle: { fill: '#7FC96C', edge: '#5EA84E' },
  star: { fill: '#F6C948', edge: '#D8A82C' },
  heart: { fill: '#EE7DA4', edge: '#CE5F86' },
};

const PATH: Record<ShapeKind, string> = {
  circle: 'M50 4 A 46 46 0 1 1 49.9 4 Z',
  square: 'M14 14 H86 A 8 8 0 0 1 94 22 V78 A 8 8 0 0 1 86 86 H14 A 8 8 0 0 1 6 78 V22 A 8 8 0 0 1 14 14 Z',
  triangle: 'M50 8 L93 84 H7 Z',
  star: 'M50 4 L61.2 34.6 L93.7 35.8 L68.1 55.9 L77 87.2 L50 69 L23 87.2 L31.9 55.9 L6.3 35.8 L38.8 34.6 Z',
  heart: 'M50 88 C 20 66 8 46 8 33 A 21 21 0 0 1 50 26 A 21 21 0 0 1 92 33 C 92 46 80 66 50 88 Z',
};

/** Where a face sits without falling off the edge of its own shape. */
const FACE: Record<ShapeKind, { eyeY: number; mouthY: number; spread: number }> = {
  circle: { eyeY: 44, mouthY: 62, spread: 13 },
  square: { eyeY: 44, mouthY: 62, spread: 13 },
  triangle: { eyeY: 56, mouthY: 71, spread: 11 },
  star: { eyeY: 44, mouthY: 57, spread: 10 },
  heart: { eyeY: 42, mouthY: 57, spread: 12 },
};

export const ShapeSVG: FC<{ kind: ShapeKind; size?: number; still?: boolean; delay?: number; className?: string }> = ({
  kind,
  size = 120,
  still = false,
  delay = 0,
  className,
}) => {
  const c = COLOR[kind];
  const f = FACE[kind];
  const eye = still ? {} : { className: 'cc-eye', style: { animationDelay: `${delay}s` } };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden style={{ overflow: 'visible' }}>
      <path d={PATH[kind]} fill={c.fill} stroke={c.edge} strokeWidth="4" strokeLinejoin="round" />
      <g {...eye}>
        <circle cx={50 - f.spread} cy={f.eyeY} r="5.5" fill="#3E3340" />
        <circle cx={50 + f.spread} cy={f.eyeY} r="5.5" fill="#3E3340" />
        <circle cx={50 - f.spread - 1.8} cy={f.eyeY - 2} r="1.9" fill="#FFFFFF" />
        <circle cx={50 + f.spread - 1.8} cy={f.eyeY - 2} r="1.9" fill="#FFFFFF" />
      </g>
      <path
        d={`M${50 - 8} ${f.mouthY} q 8 7 16 0`}
        stroke="#3E3340"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** The same outline, cut out of the lid. */
export const HoleSVG: FC<{ kind: ShapeKind; size?: number; lit?: boolean }> = ({ kind, size = 110, lit = false }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ overflow: 'visible' }}>
    <path
      d={PATH[kind]}
      fill="#3B2A1E"
      stroke={lit ? COLOR[kind].fill : '#5A4130'}
      strokeWidth={lit ? 6 : 4}
      strokeLinejoin="round"
    />
  </svg>
);
