import { lazy } from 'react';
import type { GameModule } from '../../engine/types';
import { AQUARIUM_COLLECTIBLES } from './collectibles';

const AquariumIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <ellipse cx="26" cy="32" rx="18" ry="13" />
    <path d="M42 32 L58 20 L58 44 Z" />
    <circle cx="18" cy="28" r="3.2" fill="#fff" />
    <circle cx="17" cy="28" r="1.7" fill="#2a2a2a" />
  </svg>
);

const aquarium: GameModule = {
  id: 'aquarium',
  title: 'Aquarium',
  rooms: ['sunroom'],
  bands: ['sprout', 'bloom'],
  themes: ['ocean', 'animals', 'fidget'],
  Icon: AquariumIcon,
  Game: lazy(() => import('./Game')),
  collectibles: AQUARIUM_COLLECTIBLES,
};

export default aquarium;
