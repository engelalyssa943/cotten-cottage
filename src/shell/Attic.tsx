import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectibleDef, Profile } from '../engine/types';
import { GAMES } from '../games/registry';
import { resolveBand } from '../engine/bands';
import { resolveTheme } from '../theme/resolve';
import { announceCollectible } from '../engine/award';
import { sound } from '../audio/sound';
import { db } from '../db/db';
import { useApp } from '../store/app';

/**
 * The Attic — the Collection Book.
 *
 * Everything here is rendered from the registry's collectible definitions, so the
 * Book knows nothing about any individual game. Deliberately absent: any count,
 * any percentage, any "3 of 12", any locked-forever item. A silhouette is an
 * invitation, never a debt. Tapping something already found replays its sparkle,
 * which is the whole reward, and can be done as many times as they like.
 */
export function Attic({ profile }: { profile: Profile }) {
  const pop = useApp((s) => s.pop);
  const reduceMotion = useApp((s) => s.reduceMotion);
  const band = useMemo(() => resolveBand(profile), [profile]);
  const theme = useMemo(() => resolveTheme(profile.favoriteColor), [profile.favoriteColor]);

  const rows = useLiveQuery(
    () => db.collections.where('profileId').equals(profile.id).toArray(),
    [profile.id],
  );
  const found = useMemo(() => new Set((rows ?? []).map((r) => r.collectibleId)), [rows]);

  /**
   * What this child could find, plus anything they already have. A star earned
   * by a game their band has since grown out of never disappears from the Book.
   */
  const items: CollectibleDef[] = useMemo(
    () =>
      GAMES.flatMap((g) =>
        (g.collectibles ?? []).filter((c) => g.bands.includes(band) || found.has(c.id)),
      ),
    [band, found],
  );

  return (
    <div className="relative h-screen w-screen overflow-y-auto" style={{ background: theme.scale[100] }}>
      {/* rafters, so it reads as an attic and not a menu */}
      <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full" aria-hidden>
        <path d="M0 0 L500 0 L0 170 Z" fill={theme.scale[200]} opacity="0.75" />
        <path d="M1000 0 L500 0 L1000 170 Z" fill={theme.scale[200]} opacity="0.75" />
        <circle cx="500" cy="86" r="44" fill="#FDF6E3" stroke={theme.scale[400]} strokeWidth="7" />
        <circle cx="486" cy="74" r="4" fill="#F2C94C" />
        <circle cx="512" cy="94" r="3" fill="#F2C94C" />
      </svg>

      <button
        onClick={pop}
        className="absolute left-4 top-4 z-10 grid h-16 w-16 place-items-center rounded-full bg-white/80 shadow active:scale-95"
        aria-label="Back to the cottage"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={theme.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      </button>

      <div className="relative mx-auto max-w-5xl px-8 pb-12 pt-28">
        <div className="flex flex-wrap justify-center gap-6">
          {items.map((c) => {
            const isFound = found.has(c.id);
            const Art = c.Art;
            return (
              <button
                key={c.id}
                onClick={(e) => {
                  if (isFound) {
                    announceCollectible(c.id, sound);
                    return;
                  }
                  // Not found yet: a friendly nudge, never a buzzer.
                  sound.blip();
                  if (reduceMotion) return;
                  const el = e.currentTarget;
                  el.classList.remove('cc-shake');
                  void el.offsetWidth;
                  el.classList.add('cc-shake');
                }}
                className="flex w-[148px] flex-col items-center gap-2 rounded-cozy bg-white/70 p-3 shadow-sm active:scale-95"
                aria-label={isFound ? c.title : 'Not found yet'}
              >
                <span className="grid h-24 w-24 place-items-center">
                  <Art found={isFound} className="h-full w-full" />
                </span>
                <span className="text-sm font-medium text-ink">
                  {isFound ? c.title : '?'}
                </span>
              </button>
            );
          })}
        </div>

        {rows !== undefined && found.size === 0 && (
          <p className="mt-8 text-center text-ink/45">
            Things you find while you play come and live up here.
          </p>
        )}
      </div>
    </div>
  );
}
