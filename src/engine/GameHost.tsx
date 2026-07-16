import { Suspense, useMemo } from 'react';
import type { CollectibleId, GameModule, Profile } from './types';
import { resolveBand } from './bands';
import { resolveTheme } from '../theme/resolve';
import { makeSaveApi } from './save';
import { awardCollectible } from './award';
import { sound } from '../audio/sound';
import { useApp } from '../store/app';

/**
 * Mounts a single game and wires the full GameProps contract: resolved band +
 * theme, a debounced save API, an idempotent award, sound, reduce-motion, and the
 * one exit callback. Games render none of this plumbing themselves.
 */
export function GameHost({
  game,
  profile,
  onExit,
}: {
  game: GameModule;
  profile: Profile;
  onExit: () => void;
}) {
  const reduceMotion = useApp((s) => s.reduceMotion);
  const band = useMemo(() => resolveBand(profile), [profile]);
  const theme = useMemo(() => resolveTheme(profile.favoriteColor), [profile.favoriteColor]);
  const save = useMemo(() => makeSaveApi(profile.id, game.id), [profile.id, game.id]);
  const award = useMemo(
    () => (id: CollectibleId) => {
      void awardCollectible(profile.id, id, sound);
    },
    [profile.id],
  );

  const Game = game.Game;
  return (
    <Suspense
      fallback={<div className="grid h-full w-full place-items-center text-ink/50">…</div>}
    >
      <Game
        profile={profile}
        band={band}
        theme={theme}
        save={save}
        award={award}
        sound={sound}
        reduceMotion={reduceMotion}
        onExit={onExit}
      />
    </Suspense>
  );
}
