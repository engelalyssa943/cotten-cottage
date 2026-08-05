import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { AnimalSVG, ANIMALS, ANIMAL_NAME, type Animal } from './animals';

const STORY: Record<Animal, string> = {
  cat: 'It was asleep in the cupboard the whole time.',
  dog: 'It heard you coming and waited very quietly.',
  bird: 'It got in through the window and liked it here.',
  frog: 'It found the coolest, dampest shelf in the kitchen.',
  mouse: 'It lives behind the flour and comes out for visitors.',
  bunny: 'It hid so well it almost missed being found.',
};

function animalCard(animal: Animal): CollectibleDef {
  return {
    id: `peekaboo:${animal}`,
    title: ANIMAL_NAME[animal],
    story: STORY[animal],
    themes: ['animals', 'cute'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <AnimalSVG animal={animal} size={104} still />
      </div>
    ),
  };
}

/** A cupboard door, ajar, with somebody behind it. */
const PeekabooIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden>
    <rect x="8" y="10" width="48" height="44" rx="6" fill="currentColor" opacity="0.28" />
    <circle cx="38" cy="34" r="11" fill="currentColor" />
    <circle cx="34" cy="32" r="2.4" fill="#FFFBF2" />
    <circle cx="42" cy="32" r="2.4" fill="#FFFBF2" />
    <path d="M8 10 h20 v44 H8 Z" fill="currentColor" />
    <circle cx="24" cy="32" r="2.6" fill="#FFFBF2" />
  </svg>
);

const peekaboo: GameModule = {
  id: 'peekaboo',
  title: 'Peekaboo',
  rooms: ['kitchen'],
  bands: ['sprout', 'bud'],
  themes: ['animals', 'cute'],
  Icon: PeekabooIcon,
  Game: lazy(() => import('./Game')),
  collectibles: ANIMALS.map(animalCard),
};

export default peekaboo;
