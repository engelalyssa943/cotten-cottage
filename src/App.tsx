import { useEffect } from 'react';
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

export default function App() {
  const hydrate = useApp((s) => s.hydrate);
  const stack = useApp((s) => s.stack);
  const activeProfileId = useApp((s) => s.activeProfileId);
  const pop = useApp((s) => s.pop);
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
        return active ? <RoomView profile={active} room={screen.room} /> : <ProfileSelect />;
      case 'game': {
        const game = active ? GAMES.find((g) => g.id === screen.gameId) ?? null : null;
        return active && game ? (
          <div className="h-screen w-screen">
            <GameHost game={game} profile={active} onExit={pop} />
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
      <AwardOverlay />
    </>
  );
}
