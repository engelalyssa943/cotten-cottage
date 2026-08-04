import { lazy } from 'react';
import type { GameModule } from '../../engine/types';

/** Rings spreading from a touch — the whole game in one glyph. */
const PondIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor">
    <circle cx="32" cy="34" r="6" strokeWidth="4" />
    <circle cx="32" cy="34" r="15" strokeWidth="3.4" opacity="0.72" />
    <circle cx="32" cy="34" r="24" strokeWidth="2.8" opacity="0.44" />
  </svg>
);

const calmPond: GameModule = {
  id: 'calm-pond',
  title: 'Calm Pond',
  rooms: ['garden'],
  // The one game every child opens, whatever age they are.
  bands: ['sprout', 'bud', 'bloom', 'star'],
  themes: ['garden', 'fidget', 'animals'],
  Icon: PondIcon,
  Game: lazy(() => import('./Game')),
};

export default calmPond;
