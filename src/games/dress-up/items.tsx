import type { ReactNode } from 'react';
import type { Slot } from './types';

/**
 * Every garment, drawn once.
 *
 * `node` is drawn in the creature's own 300x360 coordinate space, so a piece
 * lands on her without any per-item positioning code. `view` is the same
 * artwork cropped to a viewBox, which is all the tray button needs — one
 * drawing serves both the creature and the tray.
 */
export interface ItemArt {
  view: string;
  node: (color: string) => ReactNode;
}

/** A soft 5-point star. Used by half a dozen pieces. */
function star(cx: number, cy: number, r: number, fill: string, key?: string | number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.44;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return <polygon key={key} points={pts.join(' ')} fill={fill} />;
}

/** A four-petal blossom. */
function bloom(cx: number, cy: number, r: number, fill: string, key?: string | number) {
  return (
    <g key={key}>
      {[0, 72, 144, 216, 288].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle key={deg} cx={cx + Math.cos(a) * r * 0.8} cy={cy + Math.sin(a) * r * 0.8} r={r * 0.62} fill={fill} />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="#FFF3D6" />
    </g>
  );
}

/** Draw one shoe (centred on x=150) onto both feet — left lands at 132, right at 168. */
function bothFeet(draw: () => ReactNode) {
  return (
    <>
      <g transform="translate(-18 0)">{draw()}</g>
      <g transform="translate(18 0)">{draw()}</g>
    </>
  );
}

/** Darker companion to a garment colour, for soles, brims and shadowed folds. */
function shade(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.82));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

export const ITEM_ART: Record<string, ItemArt> = {
  // ---------------------------------------------------------------- head ----
  'head:crown': {
    view: '100 38 100 72',
    node: (c) => (
      <>
        <path
          d="M110 92 L118 56 L132 78 L143 52 L157 52 L168 78 L182 56 L190 92 Q150 104 110 92 Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="118" cy="56" r="5" fill="#FFFBF2" />
        <circle cx="182" cy="56" r="5" fill="#FFFBF2" />
        <path d="M112 88 Q150 99 188 88" stroke={shade(c)} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'head:flowers': {
    view: '94 64 112 50',
    node: (c) => (
      <>
        <path d="M104 100 Q150 78 196 100" stroke="#7FBF74" strokeWidth="5" fill="none" strokeLinecap="round" />
        {[
          [108, 98],
          [128, 86],
          [150, 80],
          [172, 86],
          [192, 98],
        ].map(([x, y], i) => bloom(x, y, 10, i % 2 ? '#FFFFFF' : c, i))}
      </>
    ),
  },
  'head:bow': {
    view: '58 48 88 50',
    node: (c) => (
      <>
        <path d="M98 74 C 76 56 66 68 72 82 C 78 92 90 84 98 74 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
        <path d="M102 74 C 124 56 134 68 128 82 C 122 92 110 84 102 74 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
        <circle cx="100" cy="76" r="8" fill={shade(c)} />
      </>
    ),
  },
  'head:party': {
    view: '68 12 74 88',
    node: (c) => (
      <>
        <path d="M104 30 L130 76 L78 90 Z" fill={c} stroke={shade(c)} strokeWidth="2" strokeLinejoin="round" />
        <path d="M92 58 L118 50" stroke="#FFFBF2" strokeWidth="5" strokeLinecap="round" />
        <path d="M86 74 L124 64" stroke="#FFFBF2" strokeWidth="5" strokeLinecap="round" />
        <circle cx="104" cy="26" r="9" fill="#FFFBF2" />
      </>
    ),
  },
  // revealed by a discovery
  'head:starcrown': {
    view: '98 26 104 84',
    node: (c) => (
      <>
        <path d="M112 94 Q150 106 188 94 L184 68 L150 80 L116 68 Z" fill={c} stroke={shade(c)} strokeWidth="2" strokeLinejoin="round" />
        {star(116, 52, 12, '#FFF3D6', 'a')}
        {star(150, 42, 15, '#FFFBF2', 'b')}
        {star(184, 52, 12, '#FFF3D6', 'c')}
      </>
    ),
  },

  // -------------------------------------------------------------- outfit ----
  'outfit:dress': {
    view: '66 168 168 162',
    node: (c) => (
      <>
        <path
          d="M104 194 Q150 176 196 194 L206 238 L224 300 Q150 322 76 300 L94 238 Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M94 238 Q150 254 206 238 L208 250 Q150 266 92 250 Z" fill={shade(c)} />
        <path d="M76 300 Q150 322 224 300" stroke="#FFFBF2" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'outfit:tutu': {
    view: '78 192 144 124',
    node: (c) => (
      <>
        <path d="M110 212 Q150 200 190 212 L192 252 Q150 242 108 252 Z" fill={shade(c)} />
        <path
          d="M94 252 Q150 232 206 252 Q216 290 196 300 Q150 314 104 300 Q84 290 94 252 Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="2"
        />
        {[104, 127, 150, 173, 196].map((x) => (
          <circle key={x} cx={x} cy={302} r="11" fill={c} />
        ))}
        <path d="M96 262 Q150 244 204 262" stroke="#FFFBF2" strokeWidth="4" fill="none" opacity="0.8" />
      </>
    ),
  },
  'outfit:cape': {
    view: '56 166 190 176',
    node: (c) => (
      <>
        <path d="M100 190 Q150 172 200 190 L234 308 Q150 334 66 308 Z" fill={c} stroke={shade(c)} strokeWidth="2" strokeLinejoin="round" />
        <path d="M150 182 L150 326" stroke={shade(c)} strokeWidth="3" opacity="0.5" />
        <path d="M108 186 Q150 176 192 186 L192 200 Q150 190 108 200 Z" fill={shade(c)} />
      </>
    ),
  },
  'outfit:sweater': {
    view: '84 166 132 112',
    node: (c) => (
      <>
        <path d="M100 192 Q150 174 200 192 L206 248 Q150 264 94 248 Z" fill={c} stroke={shade(c)} strokeWidth="2" strokeLinejoin="round" />
        <path d="M94 248 Q150 264 206 248 L208 266 Q150 282 92 266 Z" fill={shade(c)} />
        <path d="M124 186 Q150 200 176 186" stroke={shade(c)} strokeWidth="4" fill="none" strokeLinecap="round" />
        {[116, 150, 184].map((x) => (
          <path key={x} d={`M${x} 206 q6 12 0 24`} stroke="#FFFBF2" strokeWidth="3" fill="none" opacity="0.55" />
        ))}
      </>
    ),
  },
  // revealed by a discovery
  'outfit:petalgown': {
    view: '62 166 176 172',
    node: (c) => (
      <>
        <path
          d="M104 194 Q150 176 196 194 L208 240 L228 302 Q150 326 72 302 Z"
          fill={c}
          stroke={shade(c)}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {[80, 104, 128, 152, 176, 200, 222].map((x, i) => (
          <circle key={x} cx={x} cy={302 - (i % 2) * 4} r="14" fill={c} opacity="0.95" />
        ))}
        <path d="M94 240 Q150 256 206 240 L208 252 Q150 268 92 252 Z" fill={shade(c)} />
        {star(120, 268, 9, '#FFFBF2', 's1')}
        {star(184, 284, 8, '#FFF3D6', 's2')}
        {star(152, 230, 7, '#FFFBF2', 's3')}
      </>
    ),
  },

  // --------------------------------------------------------------- shoes ----
  'shoes:boots': {
    view: '108 284 84 58',
    node: (c) =>
      bothFeet(() => (
        <>
          <path d="M136 296 h28 v24 q0 14 -14 14 q-14 0 -14 -14 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
          <rect x="132" y="290" width="36" height="12" rx="6" fill={shade(c)} />
          <path d="M136 328 q14 8 28 0" stroke={shade(c)} strokeWidth="4" fill="none" />
        </>
      )),
  },
  'shoes:ballet': {
    view: '108 276 84 66',
    node: (c) =>
      bothFeet(() => (
        <>
          <path d="M136 314 q14 -8 28 0 q0 20 -14 20 q-14 0 -14 -20 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
          <path d="M138 312 q12 6 24 0" stroke="#FFFBF2" strokeWidth="3" fill="none" />
          <path d="M139 310 q-4 -18 4 -30" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M161 310 q4 -18 -4 -30" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )),
  },
  'shoes:sneakers': {
    view: '108 292 84 50',
    node: (c) =>
      bothFeet(() => (
        <>
          <path d="M134 304 h32 v18 h-32 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
          <rect x="130" y="320" width="40" height="12" rx="6" fill="#FFFBF2" stroke={shade(c)} strokeWidth="2" />
          <path d="M136 310 L162 318" stroke="#FFFBF2" strokeWidth="4" strokeLinecap="round" />
        </>
      )),
  },
  'shoes:slippers': {
    view: '106 288 88 56',
    node: (c) =>
      bothFeet(() => (
        <>
          <path d="M134 312 q16 -10 32 0 q2 22 -16 22 q-18 0 -16 -22 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
          {[136, 146, 156, 164].map((x) => (
            <circle key={x} cx={x} cy="308" r="7" fill="#FFFBF2" />
          ))}
        </>
      )),
  },
  // revealed by a discovery
  'shoes:cloudboots': {
    view: '104 282 92 62',
    node: (c) =>
      bothFeet(() => (
        <>
          <path d="M136 300 h28 v22 q0 14 -14 14 q-14 0 -14 -14 Z" fill={c} stroke={shade(c)} strokeWidth="2" />
          {[
            [134, 296, 11],
            [148, 290, 13],
            [164, 296, 11],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity="0.95" />
          ))}
          {star(150, 322, 7, '#FFF3D6', 'sp')}
        </>
      )),
  },

  // --------------------------------------------------------------- wings ----
  'wings:sparkles': {
    view: '14 96 272 116',
    node: (c) => (
      <>
        {star(30, 124, 13, c, 'l1')}
        {star(60, 156, 9, c, 'l2')}
        {star(86, 182, 7, c, 'l3')}
        {star(270, 124, 13, c, 'r1')}
        {star(240, 156, 9, c, 'r2')}
        {star(214, 182, 7, c, 'r3')}
      </>
    ),
  },
  'wings:ribbons': {
    view: '30 160 240 130',
    node: (c) => (
      <>
        {[
          'M64 182 q -14 30 4 50 q 14 16 2 34',
          'M84 190 q -10 26 6 44 q 12 14 0 30',
          'M236 182 q 14 30 -4 50 q -14 16 -2 34',
          'M216 190 q 10 26 -6 44 q -12 14 0 30',
        ].map((d, i) => (
          <path key={i} d={d} stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" opacity={i % 2 ? 0.75 : 1} />
        ))}
      </>
    ),
  },
  'wings:butterfly': {
    view: '16 100 268 110',
    node: (c) => (
      <>
        {[
          [52, 146, 13],
          [78, 172, 10],
          [40, 178, 8],
          [248, 146, 13],
          [222, 172, 10],
          [260, 178, 8],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={c} />
            <circle cx={x} cy={y} r={r * 0.45} fill="#FFFBF2" />
          </g>
        ))}
      </>
    ),
  },
  // revealed by a discovery
  'wings:aurora': {
    view: '14 96 272 120',
    node: (c) => (
      <>
        <path d="M106 194 C 64 196 30 168 26 122 C 66 126 98 152 110 186 Z" fill={c} opacity="0.5" />
        <path d="M194 194 C 236 196 270 168 274 122 C 234 126 202 152 190 186 Z" fill={c} opacity="0.5" />
        <path d="M96 186 C 66 182 42 160 38 132" stroke="#FFFBF2" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d="M204 186 C 234 182 258 160 262 132" stroke="#FFFBF2" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9" />
        {star(34, 118, 11, '#FFFBF2', 'a1')}
        {star(266, 118, 11, '#FFFBF2', 'a2')}
        {star(70, 164, 8, '#FFF3D6', 'a3')}
        {star(230, 164, 8, '#FFF3D6', 'a4')}
      </>
    ),
  },

  // ---------------------------------------------------------------- face ----
  'face:freckles': {
    view: '96 138 108 34',
    node: (c) => (
      <>
        {[
          [104, 150],
          [112, 160],
          [102, 164],
          [196, 150],
          [188, 160],
          [198, 164],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.4" fill={c} opacity="0.75" />
        ))}
      </>
    ),
  },
  'face:glasses': {
    view: '98 108 104 58',
    node: (c) => (
      <>
        <circle cx="130" cy="136" r="21" fill="#FFFFFF" opacity="0.28" />
        <circle cx="170" cy="136" r="21" fill="#FFFFFF" opacity="0.28" />
        <circle cx="130" cy="136" r="21" fill="none" stroke={c} strokeWidth="5" />
        <circle cx="170" cy="136" r="21" fill="none" stroke={c} strokeWidth="5" />
        <path d="M151 134 h-2" stroke={c} strokeWidth="5" strokeLinecap="round" />
        <path d="M109 130 L100 124" stroke={c} strokeWidth="5" strokeLinecap="round" />
        <path d="M191 130 L200 124" stroke={c} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },
  'face:starcheeks': {
    view: '96 140 108 36',
    node: (c) => (
      <>
        {star(110, 158, 12, c, 'l')}
        {star(190, 158, 12, c, 'r')}
      </>
    ),
  },
  'face:lashes': {
    view: '104 100 92 40',
    node: (c) => (
      <>
        {[
          'M116 124 l-9 -8',
          'M124 118 l-6 -10',
          'M133 115 l-2 -11',
          'M184 124 l9 -8',
          'M176 118 l6 -10',
          'M167 115 l2 -11',
        ].map((d, i) => (
          <path key={i} d={d} stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" />
        ))}
      </>
    ),
  },
};

export function artFor(slot: Slot, kind: string): ItemArt | undefined {
  return ITEM_ART[`${slot}:${kind}`];
}

/** The same drawing, cropped — what a tray button shows. */
export function ItemThumb({ slot, kind, color, size = 56 }: { slot: Slot; kind: string; color: string; size?: number }) {
  const art = artFor(slot, kind);
  if (!art) return null;
  return (
    <svg viewBox={art.view} width={size} height={size} aria-hidden style={{ overflow: 'visible' }}>
      {art.node(color)}
    </svg>
  );
}
