export type DayPhase = 'morning' | 'day' | 'dusk' | 'night';

/** Cosmetic time-of-day, from the device clock. */
export function dayPhase(d: Date = new Date()): DayPhase {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export type Weather = 'clear' | 'rain';

/** Deterministic per calendar day, so the weather doesn't flicker within a session. */
export function weatherFor(d: Date = new Date()): Weather {
  const dayStart = new Date(d.getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((d.getTime() - dayStart) / 86_400_000);
  return dayOfYear % 5 === 0 ? 'rain' : 'clear';
}
