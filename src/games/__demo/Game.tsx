import { useEffect, useState } from 'react';
import type { GameProps } from '../../engine/types';

/**
 * THROWAWAY. Proves the game contract end-to-end: it renders in the right room for
 * the right band, saves a counter that survives reload, and awards a collectible —
 * without any other file in the app knowing it exists. Deleted before shipping.
 */
interface DemoSave {
  count: number;
}

export default function DemoGame({ save, award, sound, onExit, theme, band }: GameProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    void save.load<DemoSave>().then((d) => {
      if (d) setCount(d.count);
    });
  }, [save]);

  const bump = () => {
    setCount((c) => {
      const next = c + 1;
      save.put<DemoSave>({ count: next });
      return next;
    });
    sound.blip();
  };

  return (
    <div
      className="grid h-full w-full place-items-center gap-6 p-8"
      style={{ background: theme.scale[200] }}
    >
      <div className="text-sm text-ink/60">demo · band: {band}</div>
      <button
        onClick={bump}
        className="grid h-48 w-48 place-items-center rounded-cozy text-2xl font-semibold text-white shadow-lg"
        style={{ background: theme.accent }}
      >
        tapped {count}
      </button>
      <div className="flex gap-4">
        <button
          onClick={() => award('__demo:star')}
          className="rounded-pill bg-white/70 px-6 py-3 text-ink shadow"
        >
          award a star
        </button>
        <button onClick={onExit} className="rounded-pill bg-white/70 px-6 py-3 text-ink shadow">
          exit
        </button>
      </div>
    </div>
  );
}
