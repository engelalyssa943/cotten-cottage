import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { MOTIFS, MOTIF_NAME, MotifSVG, type Motif } from './motifs';

const STORY: Record<Motif, string> = {
  sun: 'It turned up on both cards at once, which suits it.',
  moon: 'It waits all day for its turn and never complains.',
  rainbow: 'There is only ever one, so finding two is quite something.',
  cloud: 'It drifted onto a card and decided to stay.',
  flower: 'Six petals, and it counted them itself.',
  leaf: 'It came off a tree in the garden and got lost in the box.',
  apple: 'Somebody polished it before it was put in.',
  cherry: 'They came as a pair already, which felt like cheating.',
  butterfly: 'It sat still just long enough to be drawn.',
  ladybird: 'Its spots match on both sides, so it is easy to find twice.',
};

function motifCard(motif: Motif): CollectibleDef {
  return {
    id: `memory-pairs:${motif}`,
    title: MOTIF_NAME[motif],
    story: STORY[motif],
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
        <MotifSVG motif={motif} size={100} />
      </div>
    ),
  };
}

/** Two cards, one turned over. */
const MemoryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <rect x="4" y="12" width="24" height="34" rx="5" opacity="0.4" transform="rotate(-8 16 29)" />
    <rect x="34" y="16" width="24" height="34" rx="5" />
    <circle cx="46" cy="33" r="7" fill="#FFFBF2" />
  </svg>
);

const memoryPairs: GameModule = {
  id: 'memory-pairs',
  title: 'Memory Pairs',
  rooms: ['workshop'],
  bands: ['bloom', 'star'],
  themes: ['cute', 'garden'],
  Icon: MemoryIcon,
  Game: lazy(() => import('./Game')),
  collectibles: MOTIFS.map(motifCard),
};

export default memoryPairs;
