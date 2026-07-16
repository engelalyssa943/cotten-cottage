import { lazy } from 'react';
import type { GameModule } from '../../engine/types';

const CakeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <path d="M12 34 h40 v18 a4 4 0 0 1-4 4 H16 a4 4 0 0 1-4-4 Z" />
    <path d="M12 34 q0-10 20-10 q20 0 20 10 Z" opacity="0.75" />
    <rect x="30" y="12" width="4" height="12" rx="2" />
    <circle cx="32" cy="10" r="4" />
  </svg>
);

const cakeDecorator: GameModule = {
  id: 'cake-decorator',
  title: 'Cake Decorator',
  rooms: ['kitchen'],
  bands: ['bloom'],
  themes: ['cooking', 'cute'],
  Icon: CakeIcon,
  Game: lazy(() => import('./Game')),
};

export default cakeDecorator;
