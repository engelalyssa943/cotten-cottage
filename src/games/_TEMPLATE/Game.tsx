import { useEffect, useState } from 'react';
import type { GameProps } from '../../engine/types';

// The shape of whatever this game needs to remember. Keep it JSON-serializable.
interface SaveShape {
  hello: string;
}

/**
 * Your game. It receives everything through props (see GameProps): the resolved
 * `band` and `theme`, a debounced `save`, an idempotent `award`, `sound`,
 * `reduceMotion`, and `onExit`. Branch on `band` to serve different children from
 * one module. Never render your own back button — call `onExit`.
 */
export default function TemplateGame({ theme, band, save, sound, onExit }: GameProps) {
  const [loaded, setLoaded] = useState<SaveShape | null>(null);

  useEffect(() => {
    void save.load<SaveShape>().then(setLoaded);
  }, [save]);

  return (
    <div
      className="grid h-full w-full place-items-center gap-4 p-8"
      style={{ background: theme.scale[100] }}
    >
      {/* TODO: build the game here. Branch on `band` to serve different ages. */}
      <p className="text-sm text-ink/50">band: {band}</p>
      <button
        onClick={() => {
          save.put<SaveShape>({ hello: 'world' });
          sound.pop();
        }}
        className="rounded-cozy px-6 py-4 text-white shadow-lg"
        style={{ background: theme.accent }}
      >
        {loaded ? 'saved ✓' : 'tap me'}
      </button>
      <button onClick={onExit} className="rounded-pill bg-white/70 px-5 py-2 text-ink shadow">
        exit
      </button>
    </div>
  );
}
