import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { GAMES } from './games/registry';
import { GameHost } from './engine/GameHost';
import { AwardOverlay } from './engine/AwardOverlay';
import { applyThemeVars } from './theme/cssVars';
import { resolveTheme } from './theme/resolve';
import { DEFAULT_SWATCH } from './theme/swatches';
import { useApp, currentScreen } from './store/app';
import type { Profile } from './engine/types';
import { ProfileSelect } from './shell/ProfileSelect';
import { Cottage } from './shell/Cottage';
import { RoomView } from './shell/RoomView';
import { ParentArea } from './shell/ParentArea';
import { WindDown } from './shell/WindDown';
import { ExitRail } from './shell/ExitRail';
import { Attic } from './shell/Attic';
import { NightShade } from './shell/NightShade';
import { ParentGate } from './shell/ParentGate';
import { flushSaves } from './engine/save';

export default function App() {
  const hydrate = useApp((s) => s.hydrate);
  const stack = useApp((s) => s.stack);
  const activeProfileId = useApp((s) => s.activeProfileId);
  const pop = useApp((s) => s.pop);
  const push = useApp((s) => s.push);
  const reset = useApp((s) => s.reset);
  const setActiveProfile = useApp((s) => s.setActiveProfile);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray()) as
    | Profile[]
    | undefined;
  const active = profiles?.find((p) => p.id === activeProfileId) ?? null;

  // Paint the whole app in the active child's color (or a soft default).
  useEffect(() => {
    applyThemeVars(resolveTheme(active?.favoriteColor ?? DEFAULT_SWATCH.hex));
  }, [active?.favoriteColor]);

  const screen = currentScreen({ stack });

  // If the active profile vanished (e.g. deleted) while inside their cottage,
  // drift back to the picker instead of showing a blank house.
  useEffect(() => {
    const needsProfile = screen.kind === 'cottage' || screen.kind === 'room' || screen.kind === 'game';
    if (needsProfile && profiles && !active) {
      setActiveProfile(null);
      reset({ kind: 'profiles' });
    }
  }, [screen.kind, active, profiles, reset, setActiveProfile]);

  /**
   * Wind-down. Off unless a grown-up set it. The clock runs from the moment a
   * child starts playing and keeps running as they move around the cottage — it
   * only restarts when the ending itself is left. Driven off the frame clock, so
   * it also pauses while the app is in the background, and so there is no
   * countdown anywhere in the codebase.
   */
  const windDownMinutes = useApp((s) => s.windDownMinutes);
  const winding = screen.kind === 'winddown';
  const screenKind = useRef(screen.kind);
  screenKind.current = screen.kind;

  useEffect(() => {
    if (!windDownMinutes || !activeProfileId || winding) return;
    const ms = windDownMinutes * 60_000;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      // Never pull the rug out from under a grown-up mid-setup.
      if (t - t0 >= ms && screenKind.current !== 'parent') {
        void flushSaves().then(() => reset({ kind: 'winddown' }));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [windDownMinutes, activeProfileId, winding, reset]);

  function renderScreen() {
    switch (screen.kind) {
      case 'profiles':
        return <ProfileSelect />;
      case 'parent':
        return <ParentArea />;
      case 'winddown':
        return <WindDown />;
      case 'cottage':
        return active ? <Cottage profile={active} /> : <ProfileSelect />;
      case 'room':
        if (!active) return <ProfileSelect />;
        // The attic isn't made of games — it's the Collection Book.
        return screen.room === 'attic' ? (
          <Attic profile={active} />
        ) : (
          <RoomView profile={active} room={screen.room} />
        );
      case 'game': {
        const game = active ? GAMES.find((g) => g.id === screen.gameId) ?? null : null;
        return active && game ? (
          // The game paints the whole screen; the rail lies on top of it as
          // frosted glass. Games size to this box and inset their controls by
          // --cc-rail, so nothing of theirs is ever underneath it.
          <div className="relative h-screen w-screen">
            <div className="absolute inset-0">
              <GameHost game={game} profile={active} onExit={pop} />
            </div>
            <ExitRail onExit={pop} />
          </div>
        ) : (
          <ProfileSelect />
        );
      }
    }
  }

  return (
    <>
      {renderScreen()}

      {/* The way in to the settings, on every screen a child can reach — the
          cottage, a room, the attic, and inside any game. Not on the grown-up
          area itself (you're already there) and not over the wind-down, which
          has its own way out. */}
      {screen.kind !== 'parent' && screen.kind !== 'winddown' && (
        <ParentGate onPass={() => push({ kind: 'parent' })} />
      )}

      <AwardOverlay />
      {/* Last, and over everything: the evening light. */}
      <NightShade />
    </>
  );
}
