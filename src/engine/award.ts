import { db } from '../db/db';
import type { CollectibleId, SoundApi } from './types';

type AwardListener = (id: CollectibleId) => void;
const listeners = new Set<AwardListener>();

/** Subscribe to fresh awards (the sparkle overlay uses this). Returns an unsubscribe. */
export function onAward(fn: AwardListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Idempotent. Awarding an already-owned collectible is a silent no-op — no sound,
 * no sparkle — so games can re-fire an award freely. A fresh award persists to the
 * collections table, plays the "collected!" motif, and notifies the sparkle overlay.
 */
export async function awardCollectible(
  profileId: string,
  id: CollectibleId,
  sound: SoundApi,
): Promise<void> {
  const existing = await db.collections.get([profileId, id]);
  if (existing) return;
  await db.collections.put({ profileId, collectibleId: id, foundAt: Date.now() });
  sound.collected();
  for (const fn of listeners) fn(id);
}
