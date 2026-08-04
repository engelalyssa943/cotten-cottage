import { lazy } from 'react';
import type { GameModule } from '../../engine/types';
import { DRESS_UP_COLLECTIBLES } from './collectibles';

/** Her face and horn — the room icon reads as "the friend", not as a menu item. */
const DressUpIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <path d="M28 18 L32 2 L36 18 Z" />
    <path d="M17 22 q-5 -9 2 -11 q5 -1 6 7 Z" />
    <path d="M47 22 q5 -9 -2 -11 q-5 -1 -6 7 Z" />
    <circle cx="32" cy="36" r="22" />
    <circle cx="24" cy="33" r="4" fill="#FFFBF2" />
    <circle cx="40" cy="33" r="4" fill="#FFFBF2" />
  </svg>
);

const dressUp: GameModule = {
  id: 'dress-up',
  title: 'Dress Up',
  rooms: ['workshop'],
  bands: ['bloom'],
  themes: ['cute', 'animals'],
  Icon: DressUpIcon,
  Game: lazy(() => import('./Game')),
  collectibles: DRESS_UP_COLLECTIBLES,
};

export default dressUp;
