import type { AgeBand, GameModule, Room } from './types';

/** Left-to-right / top-to-bottom order the rooms appear in the cutaway cottage. */
export const ROOM_ORDER: Room[] = ['kitchen', 'workshop', 'sunroom', 'garden', 'attic', 'door'];

/** Games in a room that are playable for this band. */
export function gamesFor(games: GameModule[], room: Room, band: AgeBand): GameModule[] {
  return games.filter((g) => g.rooms.includes(room) && g.bands.includes(band));
}

/**
 * Whether this band can find anything at all — i.e. whether any game it can open
 * defines a collectible. The Attic hangs off this rather than off a game, because
 * the Collection Book is not a game and shouldn't need one to exist.
 */
export function canEarnCollectibles(games: GameModule[], band: AgeBand): boolean {
  return games.some((g) => g.bands.includes(band) && (g.collectibles?.length ?? 0) > 0);
}

/**
 * The rooms that render for a child of this band. A room with zero games for the
 * band is simply absent — not greyed out, not "coming soon". This is the whole
 * trick that makes the cottage GROW: shipping a new module for an empty room makes
 * that room appear, with no other code change.
 *
 * The attic is the one room that is not made of games: it holds the Collection
 * Book, so it appears as soon as the child's band has something it could find
 * (and still appears if a game ever chooses to hang there too).
 */
export function roomsForProfile(games: GameModule[], band: AgeBand): Room[] {
  return ROOM_ORDER.filter((room) =>
    room === 'attic'
      ? canEarnCollectibles(games, band) || gamesFor(games, room, band).length > 0
      : gamesFor(games, room, band).length > 0,
  );
}
