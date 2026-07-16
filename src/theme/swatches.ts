export interface Swatch {
  id: string;
  name: string;
  /** The base "favorite color" a whole theme is resolved from. */
  hex: string;
}

/**
 * Curated, kid-safe favorite colors. Each is desaturated and high-lightness so
 * the resolved palette is always soft — never the screaming saturation kids' apps
 * default to. Pink-forward and ocean-blue-forward options are both here on purpose
 * (the niece and the nephew).
 */
export const SWATCHES: Swatch[] = [
  { id: 'blossom', name: 'Blossom', hex: '#F7A8C4' },
  { id: 'bubblegum', name: 'Bubblegum', hex: '#F58FB6' },
  { id: 'rose', name: 'Warm Rose', hex: '#EF8FA0' },
  { id: 'coral', name: 'Coral', hex: '#F6A08A' },
  { id: 'butter', name: 'Butter', hex: '#F2C97C' },
  { id: 'meadow', name: 'Meadow', hex: '#94CE9A' },
  { id: 'mint', name: 'Mint', hex: '#8ED6C0' },
  { id: 'sky', name: 'Sky', hex: '#8CC7EB' },
  { id: 'ocean', name: 'Ocean', hex: '#6FB2E0' },
  { id: 'periwinkle', name: 'Periwinkle', hex: '#A5AEEB' },
  { id: 'lavender', name: 'Lavender', hex: '#C4A6E6' },
  { id: 'grape', name: 'Grape', hex: '#B98FD9' },
];

export const DEFAULT_SWATCH: Swatch = SWATCHES[0];

export function swatchByHex(hex: string): Swatch | undefined {
  return SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
}
