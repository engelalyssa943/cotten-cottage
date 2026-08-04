// The shape of a look, and every palette the dresser offers.
// Creature art lives in creature.tsx; garment art lives in items.tsx.

export type Slot = 'wings' | 'outfit' | 'shoes' | 'face' | 'head';

/** A worn garment: which piece, and which colour it was tapped around to. */
export interface Worn {
  kind: string;
  color: string;
}

export type SceneKind = 'meadow' | 'clouds' | 'night' | 'castle';

export interface Look {
  id: string;
  /** The creature herself. */
  body: string;
  mane: string;
  scene: SceneKind;
  head: Worn | null;
  outfit: Worn | null;
  shoes: Worn | null;
  wings: Worn | null;
  face: Worn | null;
}

export interface WardrobeSave {
  looks: Look[];
  /** Collectible ids whose sparkle piece has been revealed. Grows, never shrinks. */
  unlocked?: string[];
}

/** Tab order in the dresser — pictures, never labels, for a child who can't read yet. */
export const SLOTS: Slot[] = ['head', 'outfit', 'shoes', 'wings', 'face'];

/** The pieces every look starts with access to. Unlocked extras are appended. */
export const BASE_ITEMS: Record<Slot, string[]> = {
  head: ['crown', 'flowers', 'bow', 'party'],
  outfit: ['dress', 'tutu', 'cape', 'sweater'],
  shoes: ['boots', 'ballet', 'sneakers', 'slippers'],
  wings: ['sparkles', 'ribbons', 'butterfly'],
  face: ['freckles', 'glasses', 'starcheeks', 'lashes'],
};

/** Tapping a worn piece walks it around its palette — no extra UI, always reversible. */
export const SLOT_PALETTE: Record<Slot, string[]> = {
  head: ['#F6C948', '#EF7DA0', '#C79BE6', '#8FD6C6', '#FFFFFF'],
  outfit: ['#F7B4CE', '#EF7DA0', '#C4A6E6', '#A9C9F0', '#8FD6C6', '#F6C948', '#FFFBF2'],
  shoes: ['#EF7DA0', '#F6C948', '#A9C9F0', '#C4A6E6', '#FFFFFF'],
  wings: ['#FFFFFF', '#F7C9DE', '#F6C948', '#A9C9F0', '#C4A6E6'],
  face: ['#EF7DA0', '#C4A6E6', '#F6C948', '#8FD6C6'],
};

// Pink-forward, per the niece — and every one of these is soft enough that no
// combination can come out harsh.
export const BODY_COLORS = [
  '#FDEBF3', '#F9CFE2', '#F2B0D2', '#DCC4F2',
  '#C6DAF6', '#C2E7DE', '#FFE2BE', '#FFF6DE', '#FFFFFF',
];

export const MANE_COLORS = [
  '#F49CC0', '#EF7DA0', '#C79BE6', '#8FB8F0',
  '#8FD6C6', '#F6C948', '#FFB38A', '#FFFFFF', '#7E6BA8',
];

export const SCENES: SceneKind[] = ['meadow', 'clouds', 'night', 'castle'];

export function blankLook(): Look {
  return {
    id: crypto.randomUUID(),
    body: BODY_COLORS[1],
    mane: MANE_COLORS[0],
    scene: 'meadow',
    head: null,
    outfit: null,
    shoes: null,
    wings: null,
    face: null,
  };
}

/** Next colour around the ring, wrapping forever. Never lands on "wrong". */
export function nextColor(slot: Slot, current: string): string {
  const ring = SLOT_PALETTE[slot];
  const i = ring.indexOf(current);
  return ring[(i + 1) % ring.length];
}
