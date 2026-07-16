import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { Profile } from '../engine/types';
import { useApp } from '../store/app';
import { Avatar } from './Avatar';
import { ParentGate } from './ParentGate';

/** "Who's playing?" — photo/initial avatars, no reading required. */
export function ProfileSelect() {
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray()) as
    | Profile[]
    | undefined;
  const setActiveProfile = useApp((s) => s.setActiveProfile);
  const reset = useApp((s) => s.reset);
  const push = useApp((s) => s.push);

  const enter = (p: Profile) => {
    setActiveProfile(p.id);
    reset({ kind: 'cottage' });
  };

  const list = profiles ?? [];

  return (
    <div className="relative min-h-screen w-full">
      <div className="mx-auto grid min-h-screen max-w-4xl place-items-center p-8">
        {list.length === 0 ? (
          <div className="rounded-cozy bg-white/80 p-10 text-center shadow-lg">
            <div className="mb-3 text-6xl">🏡</div>
            <h1 className="mb-2 text-2xl font-semibold text-ink">Cotten Cottage</h1>
            <p className="mb-6 max-w-sm text-ink/60">
              A cozy little house of things to make and play with.
            </p>
            <button
              onClick={() => push({ kind: 'parent' })}
              className="rounded-pill bg-accent px-6 py-3 text-white shadow-md active:scale-95"
            >
              Grown-up setup →
            </button>
          </div>
        ) : (
          <div className="w-full text-center">
            <h1 className="mb-8 text-2xl font-semibold text-ink/70">Who's playing?</h1>
            <div className="flex flex-wrap items-start justify-center gap-8">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => enter(p)}
                  className="flex flex-col items-center gap-3 active:scale-95"
                >
                  <Avatar profile={p} size={128} />
                  <span className="text-lg font-medium text-ink">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <ParentGate onPass={() => push({ kind: 'parent' })} />
    </div>
  );
}
