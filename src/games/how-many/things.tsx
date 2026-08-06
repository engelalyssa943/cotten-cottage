import type { FC } from 'react';

/**
 * Things worth counting, drawn fresh for this game.
 *
 * All five are about the same visual weight and sit inside the same box, so a
 * row of seven ducks reads as exactly as many as a row of seven apples. If one
 * shape were much bigger or busier than the others it would quietly change how
 * hard the counting is, which is not a difficulty knob anyone chose.
 */

export type Thing = 'apple' | 'duck' | 'star' | 'ball' | 'flower';

export const THINGS: Thing[] = ['apple', 'duck', 'star', 'ball', 'flower'];

export const THING_NAME: Record<Thing, string> = {
  apple: 'Apples',
  duck: 'Ducks',
  star: 'Stars',
  ball: 'Balls',
  flower: 'Flowers',
};

export const ThingSVG: FC<{ thing: Thing; size?: number; className?: string }> = ({
  thing,
  size = 80,
  className,
}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden>
    {thing === 'apple' && (
      <g>
        <path d="M50 30 C 36 18 14 30 18 52 C 22 76 38 92 50 92 C 62 92 78 76 82 52 C 86 30 64 18 50 30 Z" fill="#E4635F" stroke="#BE4844" strokeWidth="3" />
        <path d="M50 32 L50 16" stroke="#7A5233" strokeWidth="5" strokeLinecap="round" />
        <path d="M52 20 C 66 10 76 16 72 26 C 66 33 56 29 52 20 Z" fill="#7FC46C" stroke="#5C9E4C" strokeWidth="2.5" />
      </g>
    )}
    {thing === 'duck' && (
      <g>
        <ellipse cx="46" cy="66" rx="30" ry="21" fill="#F8CE4E" stroke="#DCAF2C" strokeWidth="3" />
        <circle cx="70" cy="40" r="17" fill="#F8CE4E" stroke="#DCAF2C" strokeWidth="3" />
        <path d="M84 38 L98 44 L84 50 Z" fill="#F0913F" />
        <circle cx="74" cy="36" r="3.4" fill="#3E3340" />
        <path d="M30 62 q 14 -8 26 2 q -12 12 -26 -2 Z" fill="#E8BC3C" />
      </g>
    )}
    {thing === 'star' && (
      <polygon points="50,8 61,38 93,39 68,59 77,90 50,72 23,90 32,59 7,39 39,38" fill="#F6C948" stroke="#D8A82C" strokeWidth="3" strokeLinejoin="round" />
    )}
    {thing === 'ball' && (
      <g>
        <circle cx="50" cy="52" r="36" fill="#5FAEE0" stroke="#3F8CBE" strokeWidth="3" />
        <path d="M50 16 C 34 34 34 70 50 88" fill="none" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M50 16 C 66 34 66 70 50 88" fill="none" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M16 46 q 34 10 68 0" fill="none" stroke="#FFFFFF" strokeWidth="5" />
      </g>
    )}
    {thing === 'flower' && (
      <g>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="50" cy="30" rx="12" ry="17" fill="#EE7DA4" stroke="#CE5F86" strokeWidth="2.5" transform={`rotate(${a} 50 52)`} />
        ))}
        <circle cx="50" cy="52" r="12" fill="#F8DC6A" stroke="#DCB93C" strokeWidth="2.5" />
      </g>
    )}
  </svg>
);
