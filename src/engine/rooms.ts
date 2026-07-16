import type { AgeBand, GameModule, Room } from './types';

/** Left-to-right / top-to-bottom order the rooms appear in the cutaway cottage. */
export const ROOM_ORDER: Room[] = ['kitchen', 'workshop', 'sunroom', 'garden', 'attic', 'door'];

/** Games in a room that are playable for this band. */
export function gamesFor(games: GameModule[], room: Room, band: AgeBand): GameModule[] {
  return games.filter((g) => g.rooms.includes(room) && g.bands.includes(band));
}

/**
 * The rooms that render for a child of this band. A room with zero games for the
 * band is simply absent — not greyed out, not "coming soon". This is the whole
 * trick that makes the cottage GROW: shipping a new module for an empty room makes
 * that room appear, with no other code change.
 */
export function roomsForProfile(games: GameModule[], band: AgeBand): Room[] {
  return ROOM_ORDER.filter((room) => gamesFor(games, room, band).length > 0);
}
