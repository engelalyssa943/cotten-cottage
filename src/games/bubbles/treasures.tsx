import type { FC } from 'react';

/**
 * Things that turn up inside a bubble every so often.
 *
 * Chosen to be recognisable to someone who has been alive about a year: a key,
 * a bell, a boat, a kite. Nothing here overlaps the animals, shapes or motifs
 * used by the other games — each game keeps its own art, so none of them can
 * break another by changing a drawing.
 */

export type Treasure = 'key' | 'bell' | 'boat' | 'kite';

export const TREASURES: Treasure[] = ['key', 'bell', 'boat', 'kite'];

export const TREASURE_NAME: Record<Treasure, string> = {
  key: 'Little Key',
  bell: 'Silver Bell',
  boat: 'Paper Boat',
  kite: 'Red Kite',
};

export const TreasureSVG: FC<{ treasure: Treasure; size?: number; className?: string }> = ({
  treasure,
  size = 60,
  className,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
    {treasure === 'key' && (
      <g>
        <circle cx="30" cy="40" r="18" fill="none" stroke="#F0B93F" strokeWidth="9" />
        <path d="M44 48 L78 76" stroke="#F0B93F" strokeWidth="9" strokeLinecap="round" />
        <path d="M66 64 L76 56 M74 72 L84 64" stroke="#F0B93F" strokeWidth="7" strokeLinecap="round" />
      </g>
    )}
    {treasure === 'bell' && (
      <g>
        <path d="M50 20 C 70 20 76 44 76 62 L 80 72 L 20 72 L 24 62 C 24 44 30 20 50 20 Z" fill="#D9DEE6" stroke="#A8B0BD" strokeWidth="3" />
        <circle cx="50" cy="16" r="7" fill="#A8B0BD" />
        <circle cx="50" cy="80" r="8" fill="#A8B0BD" />
      </g>
    )}
    {treasure === 'boat' && (
      <g>
        <path d="M14 60 L86 60 L70 82 L30 82 Z" fill="#FFFBF2" stroke="#C9C2B4" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 56 L50 18 L80 52 Z" fill="#EE7DA4" stroke="#CE5F86" strokeWidth="3" strokeLinejoin="round" />
        <path d="M46 56 L46 22 L20 52 Z" fill="#FFFFFF" stroke="#C9C2B4" strokeWidth="3" strokeLinejoin="round" />
      </g>
    )}
    {treasure === 'kite' && (
      <g>
        <path d="M50 10 L78 44 L50 84 L22 44 Z" fill="#E4635F" stroke="#BE4844" strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 10 L50 84 M22 44 L78 44" stroke="#FFFFFF" strokeWidth="3" opacity="0.8" />
        <path d="M50 84 q 8 10 -2 16 q -10 6 -2 14" stroke="#F0B93F" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    )}
  </svg>
);
