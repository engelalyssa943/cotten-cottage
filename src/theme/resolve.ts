import type { ResolvedTheme, ThemeScaleStep } from '../engine/types';

/**
 * Turn a single favorite hex into a whole soft palette. Saturation is clamped so no
 * swatch can ever produce harsh color, and lightness is stepped to a gentle ramp.
 */

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(n, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

const STEP_LIGHTNESS: Record<ThemeScaleStep, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.86,
  300: 0.78,
  400: 0.7,
  500: 0.62,
  600: 0.53,
  700: 0.45,
  800: 0.37,
  900: 0.28,
};

const CREAM = '#FBF7F0';

export function resolveTheme(favoriteHex: string): ResolvedTheme {
  const [r, g, b] = hexToRgb(favoriteHex);
  const [h, s0] = rgbToHsl(r, g, b);
  // Keep it soft: no screaming saturation, but never fully grey either.
  const s = clamp(s0, 0.28, 0.62);

  const scale = {} as Record<ThemeScaleStep, string>;
  (Object.keys(STEP_LIGHTNESS) as unknown as ThemeScaleStep[]).forEach((stepKey) => {
    const step = Number(stepKey) as ThemeScaleStep;
    scale[step] = hslToHex(h, s, STEP_LIGHTNESS[step]);
  });

  return {
    favorite: favoriteHex,
    paint: scale[100],
    paintDeep: scale[200],
    accent: scale[500],
    accentSoft: scale[300],
    // Warm dark ink, gently tinted toward the favorite hue.
    ink: hslToHex(h, clamp(s * 0.5, 0.14, 0.34), 0.24),
    cream: CREAM,
    // A soft daytime sky that leans toward the favorite color a little.
    sky: mix('#EAF4FB', scale[100], 0.45),
    scale,
  };
}
