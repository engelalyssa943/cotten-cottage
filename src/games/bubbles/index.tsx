import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { TREASURES, TREASURE_NAME, TreasureSVG, type Treasure } from './treasures';

const STORY: Record<Treasure, string> = {
  key: 'It does not open anything. It just liked being carried about.',
  bell: 'It rang once, very quietly, on the way up.',
  boat: 'Folded by somebody, a long time before the bubble found it.',
  kite: 'It had been waiting for a windy day and settled for a bubble.',
};

function treasureCard(treasure: Treasure): CollectibleDef {
  return {
    id: `bubbles:${treasure}`,
    title: TREASURE_NAME[treasure],
    story: STORY[treasure],
    themes: ['cute', 'fidget'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <TreasureSVG treasure={treasure} size={96} />
      </div>
    ),
  };
}

/** Three bubbles, one just gone. */
const BubblesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <circle cx="22" cy="40" r="15" fill="currentColor" opacity="0.4" />
    <circle cx="17" cy="35" r="4" fill="#FFFBF2" />
    <circle cx="44" cy="22" r="10" fill="currentColor" opacity="0.4" />
    <circle cx="41" cy="19" r="3" fill="#FFFBF2" />
    <circle cx="46" cy="47" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" />
  </svg>
);

const bubbles: GameModule = {
  id: 'bubbles',
  title: 'Bubbles',
  rooms: ['garden'],
  bands: ['sprout', 'bud'],
  themes: ['fidget', 'cute'],
  Icon: BubblesIcon,
  Game: lazy(() => import('./Game')),
  collectibles: TREASURES.map(treasureCard),
};

export default bubbles;
