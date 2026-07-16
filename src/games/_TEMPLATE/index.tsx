import { lazy } from 'react';
import type { GameModule } from '../../engine/types';

// 1. Copy this folder to src/games/<your-game-id>/
// 2. Fill in the fields below and build Game.tsx
// 3. Add one line to src/games/registry.ts
// Nothing else in the app needs to change.

// Inline SVG only — no image files. This is the room/tray icon for the game.
const TemplateIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <circle cx="32" cy="32" r="24" fill="currentColor" />
  </svg>
);

const template: GameModule = {
  id: 'template', // TODO: a stable, unique, forever id (kebab-case)
  title: 'Template', // TODO
  rooms: ['sunroom'], // TODO: one or more of kitchen/workshop/sunroom/garden/attic/door
  bands: ['bloom'], // TODO: which bands you actually built for
  themes: ['cute'], // TODO
  Icon: TemplateIcon,
  Game: lazy(() => import('./Game')),
  // Optional — anything this game can award, with the art + story the Attic shows.
  collectibles: [
    // {
    //   id: 'template:example',
    //   title: 'Example',
    //   story: 'A gentle sentence shown when it is found.',
    //   Art: ({ found, className }) => (
    //     <svg viewBox="0 0 64 64" className={className}>
    //       <circle cx="32" cy="32" r="24" fill={found ? '#F7C948' : '#D8D2CC'} />
    //     </svg>
    //   ),
    // },
  ],
  // Only the 'door' room uses this — a recent date gets a "new!" ribbon.
  // publishedAt: '2026-07-15',
};

export default template;
