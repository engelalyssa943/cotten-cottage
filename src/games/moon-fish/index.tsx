import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';

/** A star with a little fish tail — the thing this story leaves behind. */
const MoonStarArt = ({ found, className }: { found: boolean; className?: string }) => (
  <div
    className={className}
    style={{ display: 'grid', placeItems: 'center', filter: found ? undefined : 'grayscale(1) opacity(0.4)' }}
  >
    <svg viewBox="0 0 120 120" width="104" height="104" aria-hidden>
      <circle cx="60" cy="60" r="46" fill="#3A3468" />
      <polygon
        points="60,20 70,48 100,50 76,68 84,98 60,80 36,98 44,68 20,50 50,48"
        fill="#F7D95C"
      />
      <ellipse cx="60" cy="64" rx="15" ry="12" fill="#A9DDF2" />
      <path d="M73 64 L86 54 L86 74 Z" fill="#7FC9E8" />
      <circle cx="54" cy="61" r="3" fill="#33324A" />
    </svg>
  </div>
);

const MOON_STAR: CollectibleDef = {
  id: 'moon-fish:moon-star',
  title: 'Moon Star',
  story: 'The fish on the moon gave it to you for coming all that way.',
  themes: ['space', 'animals'],
  Art: MoonStarArt,
};

const MoonFishIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <path d="M32 6 C 42 16 46 30 44 42 L 20 42 C 18 30 22 16 32 6 Z" />
    <path d="M20 42 L 12 54 L 26 49 Z" />
    <path d="M44 42 L 52 54 L 38 49 Z" />
    <circle cx="32" cy="26" r="7" fill="#FFFBF2" />
  </svg>
);

const moonFish: GameModule = {
  id: 'moon-fish',
  title: 'Moon Fish',
  rooms: ['door'],
  // Aunt Alyssa's story is for both of them.
  bands: ['sprout', 'bloom'],
  themes: ['space', 'animals', 'cute'],
  Icon: MoonFishIcon,
  Game: lazy(() => import('./Game')),
  collectibles: [MOON_STAR],
  publishedAt: '2026-08-04',
};

export default moonFish;
