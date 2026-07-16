import { useMemo } from 'react';
import type { Profile, Room } from '../engine/types';
import { GAMES } from '../games/registry';
import { resolveBand } from '../engine/bands';
import { gamesFor } from '../engine/rooms';
import { resolveTheme } from '../theme/resolve';
import { useApp } from '../store/app';

const ROOM_LABEL: Record<Room, string> = {
  kitchen: 'Kitchen',
  workshop: 'Workshop',
  sunroom: 'Sunroom',
  garden: 'Garden',
  attic: 'Attic',
  door: "Aunt Alyssa's Door",
};

const HOME_TARGET: Record<string, number> = { sprout: 128, bud: 108, bloom: 92, star: 72 };

/** Inside a room: pick a game. Only shown when a room has more than one game. */
export function RoomView({ profile, room }: { profile: Profile; room: Room }) {
  const pop = useApp((s) => s.pop);
  const push = useApp((s) => s.push);
  const band = useMemo(() => resolveBand(profile), [profile]);
  const theme = useMemo(() => resolveTheme(profile.favoriteColor), [profile.favoriteColor]);
  const games = useMemo(() => gamesFor(GAMES, room, band), [room, band]);
  const target = HOME_TARGET[band] ?? 92;

  return (
    <div className="relative min-h-screen w-full" style={{ background: theme.scale[100] }}>
      <button
        onClick={pop}
        className="absolute left-4 top-4 grid h-16 w-16 place-items-center rounded-full bg-white/80 shadow active:scale-95"
        aria-label="Back to the cottage"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={theme.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      </button>

      <div className="mx-auto grid min-h-screen max-w-4xl place-items-center p-8">
        <div className="w-full text-center">
          <h1 className="mb-8 text-xl font-medium text-ink/60">{ROOM_LABEL[room]}</h1>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => push({ kind: 'game', gameId: g.id })}
                className="flex flex-col items-center gap-3 active:scale-95"
                aria-label={g.title}
              >
                <span
                  className="grid place-items-center rounded-cozy bg-white shadow-md"
                  style={{ width: target, height: target, color: theme.accent }}
                >
                  <g.Icon className="h-2/3 w-2/3" />
                </span>
                <span className="text-lg font-medium text-ink">{g.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
