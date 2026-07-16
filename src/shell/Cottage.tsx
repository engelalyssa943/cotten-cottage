import { useMemo } from 'react';
import type { AgeBand, Profile } from '../engine/types';
import { GAMES } from '../games/registry';
import { resolveBand } from '../engine/bands';
import { gamesFor, roomsForProfile } from '../engine/rooms';
import { resolveTheme } from '../theme/resolve';
import { useApp } from '../store/app';
import { dayPhase, weatherFor } from './time';
import { CottageScene } from './CottageScene';
import { ParentGate } from './ParentGate';
import { Avatar } from './Avatar';

const DOOR_NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function doorIsNew(band: AgeBand): boolean {
  const now = Date.now();
  return GAMES.some(
    (g) =>
      g.rooms.includes('door') &&
      g.bands.includes(band) &&
      g.publishedAt !== undefined &&
      now - Date.parse(g.publishedAt) < DOOR_NEW_WINDOW_MS,
  );
}

/** The home screen: the child's cutaway cottage, painted in their color. */
export function Cottage({ profile }: { profile: Profile }) {
  const reduceMotion = useApp((s) => s.reduceMotion);
  const push = useApp((s) => s.push);
  const reset = useApp((s) => s.reset);

  const band = useMemo(() => resolveBand(profile), [profile]);
  const theme = useMemo(() => resolveTheme(profile.favoriteColor), [profile.favoriteColor]);
  const rooms = useMemo(() => roomsForProfile(GAMES, band), [band]);

  const onEnter = (room: (typeof rooms)[number]) => {
    const games = gamesFor(GAMES, room, band);
    // Fewer steps for the littlest: a room with one game opens it directly.
    if (games.length === 1) push({ kind: 'game', gameId: games[0].id });
    else push({ kind: 'room', room });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ background: theme.sky }}>
      <CottageScene
        rooms={rooms}
        childName={profile.name}
        theme={theme}
        phase={dayPhase()}
        weather={weatherFor()}
        doorIsNew={doorIsNew(band)}
        reduceMotion={reduceMotion}
        onEnter={onEnter}
      />

      {/* Switch child — small, in the top-left; not destructive. */}
      <button
        onClick={() => reset({ kind: 'profiles' })}
        className="absolute left-4 top-4 rounded-full bg-white/70 p-1 shadow active:scale-95"
        aria-label="Switch player"
      >
        <Avatar profile={profile} size={52} />
      </button>

      <ParentGate onPass={() => push({ kind: 'parent' })} />
    </div>
  );
}
