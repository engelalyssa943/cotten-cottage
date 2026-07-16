// Generate all PWA icons by rasterizing an inline SVG at build time.
// No image files live in the repo — this runs as `prebuild` and writes to public/
// (which is gitignored). Keeps the "no external/committed art" rule intact.

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });

const CREAM = '#FBEFE6';

/** A cozy cottage mark. `maskable` fills the whole canvas and keeps the art in the safe zone. */
function cottageSvg(maskable) {
  const bg = maskable
    ? `<rect width="512" height="512" fill="${CREAM}"/>`
    : `<rect x="10" y="10" width="492" height="492" rx="116" fill="${CREAM}"/>`;
  const scale = maskable ? 0.68 : 0.82;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${bg}
  <g transform="translate(256 262) scale(${scale}) translate(-256 -256)">
    <path d="M256 74 l15 31 34 5 -25 24 6 34 -30 -16 -30 16 6 -34 -25 -24 34 -5 Z" fill="#F6C948"/>
    <path d="M144 252 L256 146 L368 252 Z" fill="#EF9BC0"/>
    <rect x="168" y="250" width="176" height="152" rx="26" fill="#FFFDF6" stroke="#E6D6C8" stroke-width="7"/>
    <rect x="234" y="300" width="56" height="102" rx="22" fill="#6FB2E0"/>
    <circle cx="278" cy="353" r="6" fill="#FFF3D6"/>
    <rect x="186" y="286" width="42" height="42" rx="11" fill="#BFE3F2" stroke="#E6D6C8" stroke-width="5"/>
  </g>
</svg>`;
}

async function png(svg, size, file) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(join(outDir, file), buf);
  console.log('  wrote', file, `${size}x${size}`);
}

const normal = cottageSvg(false);
const maskable = cottageSvg(true);

await png(normal, 192, 'pwa-192.png');
await png(normal, 512, 'pwa-512.png');
await png(maskable, 512, 'pwa-512-maskable.png');
await png(normal, 180, 'apple-touch-icon.png');
await png(normal, 64, 'favicon.png');

console.log('PWA icons generated.');
