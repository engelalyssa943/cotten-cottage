import type { ResolvedTheme } from '../engine/types';

/** Push a resolved theme onto :root as --cc-* variables Tailwind reads from. */
export function applyThemeVars(
  theme: ResolvedTheme,
  root: HTMLElement = document.documentElement,
): void {
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--cc-favorite', theme.favorite);
  set('--cc-paint', theme.paint);
  set('--cc-paint-deep', theme.paintDeep);
  set('--cc-accent', theme.accent);
  set('--cc-accent-soft', theme.accentSoft);
  set('--cc-ink', theme.ink);
  set('--cc-cream', theme.cream);
  set('--cc-sky', theme.sky);
  for (const [step, hex] of Object.entries(theme.scale)) set(`--cc-${step}`, hex);
}
