import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hold-to-activate. Used for the parent-gate corner and the in-game exit corner —
 * things a curious 1-year-old cannot trigger by slapping, but a grown-up can.
 * Uses requestAnimationFrame for the progress fill (not a countdown timer).
 */
export function useHold(onActivate: () => void, ms = 3000) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const startedAt = useRef(0);
  const holding = useRef(false);

  const stop = useCallback(() => {
    holding.current = false;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    if (!holding.current) return;
    const p = Math.min(1, (performance.now() - startedAt.current) / ms);
    setProgress(p);
    if (p >= 1) {
      holding.current = false;
      setProgress(0);
      onActivate();
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [ms, onActivate]);

  const begin = useCallback(() => {
    holding.current = true;
    startedAt.current = performance.now();
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  return {
    progress,
    bind: {
      onPointerDown: begin,
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
    },
  };
}
