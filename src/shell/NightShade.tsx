import { useEffect, useState } from 'react';
import { dayPhase, type DayPhase } from './time';

/**
 * Evening light, laid over the whole app.
 *
 * The cottage used to change colour after dark — a purple sky, darker grass, a
 * yellow wash over every room — which read as the house being repainted rather
 * than the sun going down. Everything now keeps its own colours at every hour,
 * and evening is this: the finished picture multiplied by a warm tint, so it
 * gets dimmer and loses blue rather than turning a different colour.
 *
 * Warm-shifting is also the point at bedtime: blue is the part of the light
 * that tells a small person to stay awake, so it is the part that goes first.
 */
const SHADE: Record<DayPhase, { tint: string; amount: number }> = {
  morning: { tint: '#FFFFFF', amount: 0 },
  day: { tint: '#FFFFFF', amount: 0 },
  dusk: { tint: '#F3C795', amount: 0.3 },
  night: { tint: '#DFA871', amount: 0.52 },
};

export function NightShade() {
  const [phase, setPhase] = useState<DayPhase>(() => dayPhase());

  useEffect(() => {
    // Re-read the wall clock now and then, so the light follows the evening in
    // a session left open. A clock poll — nothing here counts down to anything.
    const id = setInterval(() => setPhase(dayPhase()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { tint, amount } = SHADE[phase];
  if (amount === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ background: tint, opacity: amount, mixBlendMode: 'multiply' }}
      aria-hidden
    />
  );
}
