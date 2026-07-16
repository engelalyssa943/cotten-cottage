import type { CollectibleDef } from '../../engine/types';
import { FishSVG, type Species } from './art';

// The species a decorated tank can reveal. Defs live here in the game folder and
// are surfaced through the module, so the Collection Book never imports game guts.

function fishCollectible(id: string, species: Species, title: string, story: string): CollectibleDef {
  return {
    id,
    title,
    story,
    themes: ['ocean', 'animals'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <FishSVG species={species} size={104} />
      </div>
    ),
  };
}

export const AQUARIUM_COLLECTIBLES: CollectibleDef[] = [
  fishCollectible('aquarium:angelfish', 'angelfish', 'Royal Angelfish', 'It only visits tanks grand enough to have a castle.'),
  fishCollectible('aquarium:goldie', 'goldie', 'Treasure Goldie', 'It followed the shine of a treasure chest all the way here.'),
  fishCollectible('aquarium:seahorse', 'seahorse', 'Curly Seahorse', 'It loves a whole garden of seaweed to hold onto.'),
  fishCollectible('aquarium:jelly', 'jelly', 'Bubblegum Jelly', 'A gentle drifter that appears once a tank feels truly cozy.'),
];

/** Which collectible a tank of decorations has earned (evaluated on every change). */
export function discoveriesFor(kinds: string[]): string[] {
  const decor = kinds.filter((k) => k.startsWith('decor:'));
  const has = (k: string) => decor.includes(`decor:${k}`);
  const plants = decor.filter((k) => k === 'decor:plant').length;
  const out: string[] = [];
  if (has('castle')) out.push('aquarium:angelfish');
  if (has('chest')) out.push('aquarium:goldie');
  if (plants >= 3) out.push('aquarium:seahorse');
  if (kinds.length >= 6) out.push('aquarium:jelly');
  return out;
}

/** The species each collectible id adds to the tank when discovered. */
export const DISCOVERY_SPECIES: Record<string, Species> = {
  'aquarium:angelfish': 'angelfish',
  'aquarium:goldie': 'goldie',
  'aquarium:seahorse': 'seahorse',
  'aquarium:jelly': 'jelly',
};
