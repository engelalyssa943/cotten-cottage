import type { Topper } from './parts';

export type BaseShape = 'round' | 'tall' | 'heart' | 'square';

export interface PlacedTopper {
  id: string;
  kind: Topper;
  fx: number; // fraction of the cake box (0..1)
  fy: number;
}

export interface Cake {
  id: string;
  base: BaseShape;
  frosting: string;
  piping: string | null;
  sprinkles: string | null;
  toppers: PlacedTopper[];
}

export interface BakerySave {
  cakes: Cake[];
}

export const BASES: BaseShape[] = ['round', 'tall', 'heart', 'square'];

// Heavy on pink, per the niece.
export const FROSTINGS = [
  '#F7B4CE', '#F58FB6', '#EF7DA0', '#F6A08A', '#F4C64B',
  '#B6E0A0', '#8FD6C6', '#A9C9F0', '#C4A6E6', '#FFFBF2',
];
export const PIPINGS = ['#FFFFFF', '#EF7DA0', '#F6C948', '#B98FD9', '#8FD6C6'];
export const SPRINKLES = ['#EF7DA0', '#F6C948', '#8FD6C6', '#A9C9F0', '#FFFFFF'];

export function blankCake(): Cake {
  return {
    id: crypto.randomUUID(),
    base: 'round',
    frosting: FROSTINGS[0],
    piping: null,
    sprinkles: null,
    toppers: [],
  };
}
