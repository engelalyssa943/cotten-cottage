import { useCallback, useEffect, useRef, useState } from 'react';
import { onAward } from './award';
import { buildCollectibleIndex } from './collectibles';
import type { CollectibleDef } from './types';
import { GAMES } from '../games/registry';
import { useApp } from '../store/app';

const INDEX = buildCollectibleIndex(GAMES);

/**
 * The celebration when something is found. Games call `award(id)`; this renders,
 * so no game reimplements the sparkle.
 *
 * It used to hold for 2.2 seconds — and because the fade was baked into the
 * same animation, only about 1.5s of that was actually at full opacity. That is
 * not long enough to read a name and a sentence out loud to a child, which is
 * the entire point of the story text. It now stays put long enough to read, and
 * there is an × to send it away once you have.
 *
 * Two details that matter:
 *
 *  - Only the × takes pointer events. The card itself does not, so a child can
 *    carry on tapping the game straight "through" it. A reward that interrupts
 *    play for seven seconds would be a punishment.
 *  - Finds that arrive together queue up rather than replacing one another, so
 *    none is lost — but a waiting queue shortens each one, so a burst of
 *    discoveries doesn't leave the celebration trailing half a minute behind.
 *    Nothing is really lost either way: every story lives in the Attic forever
 *    and can be replayed by tapping it.
 */

/** Long enough to read a name and a sentence aloud. */
const SOLO_MS = 7000;
/** Others are waiting, so keep things moving. */
const QUEUED_MS = 3000;
const FADE_MS = 260;

interface Shown {
  def: CollectibleDef;
  /** Makes a repeat of the same item a fresh entry, so its timer restarts. */
  nonce: number;
}

export function AwardOverlay() {
  const reduceMotion = useApp((s) => s.reduceMotion);
  const [queue, setQueue] = useState<Shown[]>([]);
  const [leaving, setLeaving] = useState(false);
  const nonce = useRef(0);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = queue[0] ?? null;
  const waiting = queue.length > 1;

  useEffect(() => {
    return onAward((id) => {
      const def = INDEX.get(id);
      if (!def) return;
      nonce.current += 1;
      const entry = { def, nonce: nonce.current };
      setQueue((q) => {
        // Already on screen (the Attic replaying it): restart rather than stack.
        if (q.length && q[0].def.id === def.id) return [entry, ...q.slice(1)];
        if (q.some((x) => x.def.id === def.id)) return q;
        return [...q, entry];
      });
    });
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setQueue((q) => q.slice(1));
      setLeaving(false);
    }, FADE_MS);
  }, []);

  // Hold, then let it go. Restarts whenever the front of the queue changes.
  useEffect(() => {
    if (!current) return;
    setLeaving(false);
    const t = setTimeout(dismiss, waiting ? QUEUED_MS : SOLO_MS);
    return () => clearTimeout(t);
  }, [current, waiting, dismiss]);

  useEffect(() => () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
  }, []);

  if (!current) return null;
  const Art = current.def.Art;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-6">
      <div
        key={current.nonce}
        className={`pointer-events-none relative max-w-sm rounded-cozy bg-white/90 px-8 py-6 text-center shadow-xl backdrop-blur ${reduceMotion ? '' : 'cc-award-in'}`}
        style={{ opacity: leaving ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}
      >
        {/* The only part that takes a tap, so the game underneath stays playable. */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="pointer-events-auto absolute -right-3 -top-3 grid h-11 w-11 place-items-center rounded-full bg-white text-ink/60 shadow-md active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="mx-auto h-28 w-28">
          <Art found className="h-full w-full" />
        </div>
        <div className="mt-2 text-xl font-semibold text-ink">{current.def.title}</div>
        <div className="mt-1 text-sm text-ink/70">{current.def.story}</div>
      </div>
    </div>
  );
}
