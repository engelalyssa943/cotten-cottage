import type { CollectibleDef, CollectibleId, GameModule } from './types';

/**
 * A global id -> definition index built from the registry. The Collection Book
 * renders any awarded collectible through this map, so it never needs to import
 * an individual game's internals.
 */
export function buildCollectibleIndex(games: GameModule[]): Map<CollectibleId, CollectibleDef> {
  const index = new Map<CollectibleId, CollectibleDef>();
  for (const g of games) {
    for (const c of g.collectibles ?? []) {
      if (!index.has(c.id)) index.set(c.id, c);
    }
  }
  return index;
}

export function allCollectibles(games: GameModule[]): CollectibleDef[] {
  return games.flatMap((g) => g.collectibles ?? []);
}
