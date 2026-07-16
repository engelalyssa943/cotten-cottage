import { lazy } from 'react';
import type { GameModule } from '../../engine/types';

const DemoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <rect x="8" y="8" width="48" height="48" rx="14" fill="currentColor" />
  </svg>
);

const StarArt = ({ found, className }: { found: boolean; className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <path
      d="M32 6l7.5 15.2 16.8 2.4-12.2 11.9 2.9 16.7L32 46.4 16.2 54.9l2.9-16.7L6.9 26.3l16.8-2.4z"
      fill={found ? '#F7C948' : '#D8D2CC'}
      stroke={found ? '#E0A93A' : '#C9C2BB'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const demo: GameModule = {
  id: '__demo',
  title: 'Demo',
  rooms: ['sunroom'],
  bands: ['sprout', 'bud', 'bloom', 'star'],
  themes: ['fidget'],
  Icon: DemoIcon,
  Game: lazy(() => import('./Game')),
  collectibles: [
    {
      id: '__demo:star',
      title: 'Demo Star',
      story: 'A little star that proves the machine works.',
      themes: ['space'],
      Art: StarArt,
    },
  ],
};

export default demo;
