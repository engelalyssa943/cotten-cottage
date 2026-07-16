import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CollectionRow } from './db/db';
import { GAMES } from './games/registry';
import { resolveBand } from './engine/bands';
import { gamesFor, roomsForProfile } from './engine/rooms';
import { GameHost } from './engine/GameHost';
import { AwardOverlay } from './engine/AwardOverlay';
import { buildCollectibleIndex } from './engine/collectibles';
import { applyThemeVars } from './theme/cssVars';
import { resolveTheme } from './theme/resolve';
import { DEFAULT_SWATCH, SWATCHES } from './theme/swatches';
import { requestPersistence, getStorageState } from './db/persist';
import { useApp } from './store/app';
import type { Profile, Room } from './engine/types';

/**
 * ⚠️ STAGE-1 DEV HARNESS — NOT THE REAL UI.
 *
 * This exists only to prove the engine + contract end-to-end (profile filtering,
 * per-band rooms, save persistence, awarding). Stage 2 replaces this entire file
 * with the real cutaway-dollhouse shell, and the __demo game is deleted then too.
 */

const ROOM_LABEL: Record<Room, string> = {
  kitchen: 'Kitchen',
  workshop: 'Workshop',
  sunroom: 'Sunroom',
  garden: 'Garden',
  attic: 'Attic',
  door: "Aunt Alyssa's Door",
};

const COLLECTIBLE_INDEX = buildCollectibleIndex(GAMES);

function birthMonthYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const hydrate = useApp((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
    applyThemeVars(resolveTheme(DEFAULT_SWATCH.hex));
  }, [hydrate]);

  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray()) ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [storageMsg, setStorageMsg] = useState('');

  const active: Profile | null = profiles.find((p) => p.id === activeId) ?? null;
  const band = active ? resolveBand(active) : null;

  useEffect(() => {
    if (active) applyThemeVars(resolveTheme(active.favoriteColor));
  }, [active?.favoriteColor, active]);

  const collection =
    useLiveQuery(
      () =>
        activeId
          ? db.collections.where('profileId').equals(activeId).toArray()
          : Promise.resolve([] as CollectionRow[]),
      [activeId],
    ) ?? [];

  const rooms = useMemo(() => (band ? roomsForProfile(GAMES, band) : []), [band]);
  const roomGames = useMemo(
    () => (room && band ? gamesFor(GAMES, room, band) : []),
    [room, band],
  );
  const game = gameId ? GAMES.find((g) => g.id === gameId) ?? null : null;

  async function createProfile(name: string, years: number, hex: string) {
    const first = (await db.profiles.count()) === 0;
    await db.profiles.add({
      id: crypto.randomUUID(),
      name,
      birthMonth: birthMonthYearsAgo(years),
      favoriteColor: hex,
      favoriteAnimals: [],
      favoriteThemes: [],
      createdAt: Date.now(),
    });
    if (first) {
      const granted = await requestPersistence();
      const state = await getStorageState();
      setStorageMsg(
        `persist(): ${granted ? 'granted' : 'denied'} · persisted=${state.persisted}` +
          (state.quotaBytes ? ` · quota≈${Math.round(state.quotaBytes / 1e6)}MB` : ''),
      );
    }
  }

  // --- In-game view ---
  if (active && game) {
    return (
      <>
        <div className="h-screen w-screen">
          <GameHost
            game={game}
            profile={active}
            onExit={() => setGameId(null)}
          />
        </div>
        <AwardOverlay />
      </>
    );
  }

  const swatchPink = SWATCHES.find((s) => s.id === 'blossom') ?? DEFAULT_SWATCH;
  const swatchOcean = SWATCHES.find((s) => s.id === 'ocean') ?? DEFAULT_SWATCH;

  return (
    <div className="min-h-screen w-full p-6 text-ink">
      <AwardOverlay />
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-cozy bg-white/70 p-4 shadow">
          <h1 className="text-2xl font-semibold">Cotten Cottage — Stage 1 harness</h1>
          <p className="text-sm text-ink/60">
            Proving the engine: profile filtering, per-band rooms, save persistence, awarding.
          </p>
        </header>

        {/* Profiles */}
        <section className="rounded-cozy bg-white/70 p-4 shadow">
          <h2 className="mb-2 font-semibold">Profiles</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              className="rounded-pill px-4 py-2 text-white shadow"
              style={{ background: swatchOcean.hex }}
              onClick={() => void createProfile('Nephew', 1, swatchOcean.hex)}
            >
              + create age 1 (sprout)
            </button>
            <button
              className="rounded-pill px-4 py-2 text-white shadow"
              style={{ background: swatchPink.hex }}
              onClick={() => void createProfile('Niece', 5, swatchPink.hex)}
            >
              + create age 5 (bloom)
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveId(p.id);
                  setRoom(null);
                  setGameId(null);
                }}
                className={`rounded-cozy px-4 py-2 shadow ${
                  p.id === activeId ? 'ring-2 ring-accent' : ''
                }`}
                style={{ background: resolveTheme(p.favoriteColor).paint }}
              >
                {p.name} · {resolveBand(p)}
              </button>
            ))}
            {profiles.length === 0 && (
              <span className="text-sm text-ink/50">No profiles yet — create the two above.</span>
            )}
          </div>
          {storageMsg && <p className="mt-2 text-xs text-ink/50">{storageMsg}</p>}
        </section>

        {/* Rooms for the active profile */}
        {active && band && (
          <section className="rounded-cozy bg-white/70 p-4 shadow">
            <h2 className="mb-1 font-semibold">
              {active.name}'s cottage — {rooms.length} room(s), band “{band}”
            </h2>
            <p className="mb-3 text-xs text-ink/50">
              Rooms appear only where a game exists for this band. (Workshop is empty, so
              it never shows.)
            </p>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoom(r)}
                  className={`rounded-cozy px-4 py-2 shadow ${
                    r === room ? 'ring-2 ring-accent' : ''
                  }`}
                  style={{ background: 'var(--cc-200)' }}
                >
                  {ROOM_LABEL[r]}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Games in the chosen room */}
        {active && room && (
          <section className="rounded-cozy bg-white/70 p-4 shadow">
            <h2 className="mb-2 font-semibold">{ROOM_LABEL[room]}</h2>
            <div className="flex flex-wrap gap-3">
              {roomGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGameId(g.id)}
                  className="flex items-center gap-2 rounded-cozy px-4 py-2 text-white shadow"
                  style={{ background: 'var(--cc-accent)' }}
                >
                  <span className="h-8 w-8">
                    <g.Icon className="h-full w-full" />
                  </span>
                  {g.title}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Collection readout */}
        {active && (
          <section className="rounded-cozy bg-white/70 p-4 shadow">
            <h2 className="mb-2 font-semibold">Collection ({collection.length} found)</h2>
            <div className="flex flex-wrap gap-3">
              {collection.map((c) => {
                const def = COLLECTIBLE_INDEX.get(c.collectibleId);
                if (!def) return null;
                const Art = def.Art;
                return (
                  <div key={c.collectibleId} className="w-16 text-center">
                    <div className="mx-auto h-14 w-14">
                      <Art found className="h-full w-full" />
                    </div>
                    <div className="text-[10px] text-ink/60">{def.title}</div>
                  </div>
                );
              })}
              {collection.length === 0 && (
                <span className="text-sm text-ink/50">
                  Nothing yet — open the demo and tap “award a star”.
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
