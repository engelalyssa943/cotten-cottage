import { db } from '../db/db';
import type { GameSaveApi } from './types';

/**
 * Debounced, per-(profile, game) save wrapper over Dexie. `put` coalesces rapid
 * updates and writes ~400ms later; it never blocks the UI. The setTimeout here is
 * a debounce, NOT a countdown — there are no pressure timers anywhere in this app.
 */

const DEBOUNCE_MS = 400;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, unknown>();

function key(profileId: string, gameId: string): string {
  return `${profileId}::${gameId}`;
}

function writeNow(k: string): Promise<unknown> {
  const value = pending.get(k);
  pending.delete(k);
  const t = timers.get(k);
  if (t) clearTimeout(t);
  timers.delete(k);
  const sep = k.indexOf('::');
  const profileId = k.slice(0, sep);
  const gameId = k.slice(sep + 2);
  return db.saves.put({ profileId, gameId, data: value, updatedAt: Date.now() });
}

export function makeSaveApi(profileId: string, gameId: string): GameSaveApi {
  const k = key(profileId, gameId);
  return {
    load: async <T>() => {
      const row = await db.saves.get([profileId, gameId]);
      return (row?.data as T | undefined) ?? null;
    },
    put: <T>(data: T) => {
      pending.set(k, data);
      const existing = timers.get(k);
      if (existing) clearTimeout(existing);
      timers.set(
        k,
        setTimeout(() => {
          void writeNow(k);
        }, DEBOUNCE_MS),
      );
    },
  };
}

/** Flush every pending save immediately (used by wind-down and before unload). */
export async function flushSaves(): Promise<void> {
  await Promise.all([...pending.keys()].map((k) => writeNow(k)));
}
