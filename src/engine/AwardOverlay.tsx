import { useEffect, useRef, useState } from 'react';
import { onAward } from './award';
import { buildCollectibleIndex } from './collectibles';
import type { CollectibleDef } from './types';
import { GAMES } from '../games/registry';

const INDEX = buildCollectibleIndex(GAMES);

/**
 * A global celebration that appears when a fresh collectible is awarded. Games call
 * `award(id)`; the engine renders this, so no game reimplements the sparkle. The
 * setTimeout below is a display duration, not a countdown.
 */
export function AwardOverlay() {
  const [item, setItem] = useState<CollectibleDef | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return onAward((id) => {
      const def = INDEX.get(id);
      if (!def) return;
      setItem(def);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setItem(null), 2200);
    });
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!item) return null;
  const Art = item.Art;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="animate-[cc-pop_2.2s_ease-out] rounded-cozy bg-white/85 px-8 py-6 text-center shadow-xl backdrop-blur">
        <div className="mx-auto h-28 w-28">
          <Art found className="h-full w-full" />
        </div>
        <div className="mt-2 text-xl font-semibold text-ink">{item.title}</div>
        <div className="mt-1 max-w-xs text-sm text-ink/70">{item.story}</div>
      </div>
    </div>
  );
}
