import type { AgeBand, Profile } from './types';

export const BANDS: AgeBand[] = ['sprout', 'bud', 'bloom', 'star'];

/** Whole years old, from a 'YYYY-MM' birth month. */
export function ageFromBirthMonth(birthMonth: string, now: Date = new Date()): number {
  const [y, m] = birthMonth.split('-').map(Number);
  if (!y || !m) return 0;
  let age = now.getFullYear() - y;
  const monthDelta = now.getMonth() + 1 - m;
  if (monthDelta < 0) age -= 1;
  return Math.max(0, age);
}

export function bandForAge(age: number): AgeBand {
  if (age <= 2) return 'sprout';
  if (age <= 4) return 'bud';
  if (age <= 7) return 'bloom';
  return 'star';
}

/**
 * Pinned band wins; otherwise it is derived from age. Resolved once at launch
 * and passed to the game as a prop — games never read the child's age directly.
 */
export function resolveBand(
  profile: Pick<Profile, 'birthMonth' | 'pinnedBand'>,
  now: Date = new Date(),
): AgeBand {
  if (profile.pinnedBand) return profile.pinnedBand;
  return bandForAge(ageFromBirthMonth(profile.birthMonth, now));
}
