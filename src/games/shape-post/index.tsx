import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { SHAPES, SHAPE_NAME, ShapeSVG, type ShapeKind } from './shapes';

const STORY: Record<ShapeKind, string> = {
  circle: 'It rolls away if you let it, so it likes being posted best.',
  square: 'Four sides the same. It is very pleased about this.',
  triangle: 'It can stand on its point if nobody is watching.',
  star: 'It came down for a look and stayed for the box.',
  heart: 'It fits in the hole shaped like itself, which it finds lovely.',
};

function shapeCard(kind: ShapeKind): CollectibleDef {
  return {
    id: `shape-post:${kind}`,
    title: SHAPE_NAME[kind],
    story: STORY[kind],
    themes: ['building', 'cute'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <ShapeSVG kind={kind} size={104} still />
      </div>
    ),
  };
}

/** A shape going into a hole — the whole game in one glyph. */
const ShapePostIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <rect x="6" y="30" width="52" height="28" rx="6" opacity="0.35" />
    <circle cx="22" cy="42" r="8" />
    <path d="M42 34 L52 50 H32 Z" />
    <circle cx="22" cy="14" r="9" opacity="0.85" />
  </svg>
);

const shapePost: GameModule = {
  id: 'shape-post',
  title: 'Post the Shapes',
  rooms: ['workshop'],
  bands: ['sprout', 'bud'],
  themes: ['building', 'cute'],
  Icon: ShapePostIcon,
  Game: lazy(() => import('./Game')),
  collectibles: SHAPES.map(shapeCard),
};

export default shapePost;
