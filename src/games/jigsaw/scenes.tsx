import type { ReactNode } from 'react';

/**
 * The pictures, drawn fresh for this game in a shared 300x200 box.
 *
 * Deliberately no gradients and no <defs>. Every piece renders the whole
 * picture inside its own <svg> and clips it, so a dozen copies of the same
 * gradient id would be live in the document at once — ids are global, and the
 * browser would quietly resolve them all to the first one. Flat colour also
 * keeps twenty-four simultaneous copies cheap to paint.
 *
 * Each is built in bands so that any single piece, cut out of it, still has
 * something recognisable in it rather than an empty patch of sky.
 */

export type SceneId = 'garden' | 'pond' | 'night';

export const SCENES: SceneId[] = ['garden', 'pond', 'night'];

export const SCENE_NAME: Record<SceneId, string> = {
  garden: 'The Garden',
  pond: 'The Pond',
  night: 'The Night Sky',
};

export const PIC_W = 300;
export const PIC_H = 200;

function Flower({ x, y, petal }: { x: number; y: number; petal: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L0 -14" stroke="#5C9E4C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0 -6 L-7 -11" stroke="#5C9E4C" strokeWidth="2" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-19} rx="4" ry="6" fill={petal} transform={`rotate(${a} 0 -14)`} />
      ))}
      <circle cx="0" cy="-14" r="3.4" fill="#F8DC6A" />
    </g>
  );
}

export function Scene({ id }: { id: SceneId }): ReactNode {
  if (id === 'garden') {
    return (
      <g>
        <rect width="300" height="200" fill="#CFEBFA" />
        <circle cx="252" cy="38" r="24" fill="#FBD75B" />
        <circle cx="60" cy="42" r="17" fill="#FFFFFF" />
        <circle cx="80" cy="36" r="21" fill="#FFFFFF" />
        <circle cx="100" cy="44" r="15" fill="#FFFFFF" />
        <path d="M0 120 q 60 -26 120 -6 q 70 22 180 -10 v 96 H0 Z" fill="#9BD489" />
        <path d="M0 150 q 80 -20 150 2 q 80 24 150 -6 v 54 H0 Z" fill="#7FC46C" />
        {/* a tree, so at least one piece is unmistakable */}
        <rect x="47" y="96" width="10" height="46" rx="4" fill="#8A6440" />
        <circle cx="52" cy="88" r="26" fill="#5EA84E" />
        <circle cx="34" cy="98" r="17" fill="#6FB85C" />
        <circle cx="70" cy="98" r="17" fill="#6FB85C" />
        <Flower x={130} y={178} petal="#EE7DA4" />
        <Flower x={168} y={188} petal="#F4C04A" />
        <Flower x={214} y={176} petal="#B7A9EC" />
        <Flower x={258} y={190} petal="#EE7DA4" />
        <Flower x={96} y={190} petal="#FFFFFF" />
      </g>
    );
  }

  if (id === 'pond') {
    return (
      <g>
        <rect width="300" height="200" fill="#8FD3D0" />
        <rect y="0" width="300" height="52" fill="#B6E6E2" />
        <rect y="150" width="300" height="50" fill="#5FAFB4" />
        {/* lily pads on the surface */}
        <circle cx="46" cy="26" r="20" fill="#6FB85C" />
        <path d="M46 26 L62 16 A 20 20 0 0 0 40 7 Z" fill="#8FD3D0" />
        <circle cx="238" cy="20" r="16" fill="#5EA84E" />
        {/* fish */}
        <g transform="translate(96 96)">
          <ellipse cx="0" cy="0" rx="30" ry="19" fill="#F2913F" />
          <path d="M26 0 L48 -16 L48 16 Z" fill="#DE7A2A" />
          <circle cx="-14" cy="-5" r="4.5" fill="#FFFFFF" />
          <circle cx="-15" cy="-5" r="2.4" fill="#33324A" />
        </g>
        <g transform="translate(210 128)">
          <ellipse cx="0" cy="0" rx="21" ry="13" fill="#EE7DA4" />
          <path d="M18 0 L34 -11 L34 11 Z" fill="#D25F86" />
          <circle cx="-9" cy="-3" r="3.4" fill="#FFFFFF" />
          <circle cx="-10" cy="-3" r="1.8" fill="#33324A" />
        </g>
        {/* weeds and bubbles */}
        <path d="M20 200 q 10 -46 2 -70" stroke="#4E9A6E" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M40 200 q -8 -38 4 -58" stroke="#5EA84E" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M276 200 q 12 -44 0 -66" stroke="#4E9A6E" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="150" cy="54" r="6" fill="#FFFFFF" opacity="0.7" />
        <circle cx="162" cy="34" r="4" fill="#FFFFFF" opacity="0.7" />
        <circle cx="140" cy="30" r="3" fill="#FFFFFF" opacity="0.6" />
      </g>
    );
  }

  return (
    <g>
      <rect width="300" height="200" fill="#2E2A5E" />
      <rect y="0" width="300" height="70" fill="#3A3570" />
      <circle cx="238" cy="46" r="26" fill="#F6EFD8" />
      <circle cx="228" cy="38" r="21" fill="#3A3570" />
      {[
        [26, 30, 3], [64, 58, 2], [104, 26, 2.6], [140, 66, 2],
        [176, 34, 2.4], [200, 76, 1.8], [280, 96, 2.2], [46, 92, 2],
        [122, 104, 2.4], [258, 132, 1.8], [86, 132, 2], [166, 122, 2.2],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFFBF2" />
      ))}
      {/* hills, so the lower pieces aren't all plain sky */}
      <path d="M0 150 q 54 -34 106 -6 q 60 32 194 -12 v 68 H0 Z" fill="#4A4382" />
      <path d="M0 172 q 70 -22 140 2 q 74 24 160 -4 v 30 H0 Z" fill="#38326A" />
      {/* a small lit window in the dark */}
      <rect x="130" y="140" width="26" height="26" rx="4" fill="#4A4382" />
      <path d="M126 141 L143 128 L160 141 Z" fill="#5B5296" />
      <rect x="138" y="150" width="10" height="10" rx="2" fill="#FBD75B" />
    </g>
  );
}
