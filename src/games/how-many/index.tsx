import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { THINGS, THING_NAME, ThingSVG, type Thing } from './things';

const STORY: Record<Thing, string> = {
  apple: 'You counted every single one, and none of them got away.',
  duck: 'They lined up to be counted, which was very good of them.',
  star: 'Counting stars is the oldest counting there is.',
  ball: 'However you jumbled them up, there were still just as many.',
  flower: 'You picked exactly the right number of them.',
};

function thingCard(thing: Thing): CollectibleDef {
  return {
    id: `how-many:${thing}`,
    title: THING_NAME[thing],
    story: STORY[thing],
    themes: ['cute', 'garden'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <ThingSVG thing={thing} size={100} />
      </div>
    ),
  };
}

/** Three things and a numeral. */
const HowManyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <circle cx="15" cy="18" r="8" />
    <circle cx="33" cy="18" r="8" />
    <circle cx="51" cy="18" r="8" />
    <path d="M22 38 h8 v20 h-6 V44 h-6 v-4 Z" />
    <path d="M36 40 a8 8 0 0 1 14 5 c0 6-10 8-12 13 h13 v4 H35 v-4 c0-8 11-9 11-13 a4 4 0 0 0-7-3 Z" />
  </svg>
);

const howMany: GameModule = {
  id: 'how-many',
  title: 'How Many?',
  rooms: ['kitchen'],
  bands: ['bloom', 'star'],
  themes: ['cute', 'building'],
  Icon: HowManyIcon,
  Game: lazy(() => import('./Game')),
  collectibles: THINGS.map(thingCard),
};

export default howMany;
