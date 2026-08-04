import type { Look, SceneKind, Slot } from './types';
import { artFor } from './items';

/**
 * The friend being dressed: a small unicorn-dragon, drawn as one 300x360 SVG.
 *
 * Garments come from items.tsx and are drawn in these same coordinates, so
 * "wearing" something is just inserting its art at the right layer. She is
 * alive when nothing is happening — breathing, blinking, mane and tail
 * swaying — the same idle-liveliness the aquarium fish have.
 */

const VIEW = '0 0 300 360';

function tint(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)).toString(16).padStart(6, '0')}`;
}

function darken(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)).toString(16).padStart(6, '0')}`;
}

/** The world behind her. Cosmetic only — nothing here is interactive. */
export function Scene({ kind }: { kind: SceneKind }) {
  return (
    <svg viewBox={VIEW} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      {kind === 'meadow' && (
        <>
          <defs>
            <linearGradient id="cc-du-meadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#CFEBFF" />
              <stop offset="1" stopColor="#EDFBE4" />
            </linearGradient>
          </defs>
          <rect width="300" height="360" fill="url(#cc-du-meadow)" />
          <circle cx="252" cy="52" r="26" fill="#FFE9A8" />
          <path d="M0 296 q 76 -34 150 -6 q 74 28 150 -6 v 76 H0 Z" fill="#B6E0A0" />
          <path d="M0 322 q 84 -22 150 0 q 66 22 150 0 v 38 H0 Z" fill="#96D086" />
          {[
            [26, 316],
            [64, 332],
            [232, 318],
            [274, 334],
            [190, 340],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="6" fill="#FFFFFF" />
              <circle cx={x} cy={y} r="2.6" fill="#F6C948" />
            </g>
          ))}
        </>
      )}

      {kind === 'clouds' && (
        <>
          <defs>
            <linearGradient id="cc-du-clouds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFE0EE" />
              <stop offset="1" stopColor="#FFF6E6" />
            </linearGradient>
          </defs>
          <rect width="300" height="360" fill="url(#cc-du-clouds)" />
          {[
            [46, 74, 1],
            [238, 108, 0.8],
            [150, 44, 0.6],
            [70, 200, 0.5],
            [252, 232, 0.55],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.92">
              <circle cx="-26" cy="6" r="18" fill="#FFFFFF" />
              <circle cx="0" cy="-6" r="24" fill="#FFFFFF" />
              <circle cx="26" cy="6" r="18" fill="#FFFFFF" />
              <rect x="-30" y="4" width="60" height="18" rx="9" fill="#FFFFFF" />
            </g>
          ))}
          <path d="M0 330 q 150 -30 300 0 v 30 H0 Z" fill="#FFFFFF" opacity="0.85" />
        </>
      )}

      {kind === 'night' && (
        <>
          <defs>
            <linearGradient id="cc-du-night" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2E2A5E" />
              <stop offset="1" stopColor="#5B4A86" />
            </linearGradient>
          </defs>
          <rect width="300" height="360" fill="url(#cc-du-night)" />
          <circle cx="246" cy="56" r="24" fill="#FFF3D6" />
          <circle cx="236" cy="48" r="22" fill="#3A3268" />
          {[
            [30, 60, 2.4],
            [78, 34, 1.8],
            [118, 74, 1.4],
            [186, 40, 2],
            [274, 128, 1.6],
            [44, 140, 1.8],
            [96, 168, 1.3],
            [212, 96, 1.5],
            [160, 22, 1.6],
            [262, 196, 1.4],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#FFFBF2" opacity="0.9" />
          ))}
          <path d="M0 318 q 150 -26 300 0 v 42 H0 Z" fill="#3C3470" />
        </>
      )}

      {kind === 'castle' && (
        <>
          <defs>
            <linearGradient id="cc-du-castle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFD3B6" />
              <stop offset="0.55" stopColor="#F6C3D8" />
              <stop offset="1" stopColor="#E6C7EE" />
            </linearGradient>
          </defs>
          <rect width="300" height="360" fill="url(#cc-du-castle)" />
          <circle cx="60" cy="70" r="30" fill="#FFEDC2" opacity="0.9" />
          <g fill="#C7A7DC" opacity="0.9">
            <rect x="24" y="150" width="34" height="120" />
            <path d="M20 150 L41 116 L62 150 Z" fill="#A98BC4" />
            <rect x="66" y="184" width="52" height="86" />
            <path d="M62 184 L92 152 L122 184 Z" fill="#A98BC4" />
            <rect x="222" y="162" width="38" height="108" />
            <path d="M218 162 L241 128 L264 162 Z" fill="#A98BC4" />
          </g>
          <path d="M0 268 q 150 -26 300 0 v 92 H0 Z" fill="#D9B6E6" />
          <path d="M0 300 q 150 -22 300 0 v 60 H0 Z" fill="#C79BE6" />
        </>
      )}
    </svg>
  );
}

/**
 * A worn piece, wrapped so tapping it walks its colour around the palette.
 * Nothing here can remove a piece — that's the tray's job — so a stray tap
 * only ever changes a colour, never loses an outfit.
 */
function Worn({
  slot,
  kind,
  color,
  onTap,
}: {
  slot: Slot;
  kind: string;
  color: string;
  onTap?: (slot: Slot) => void;
}) {
  const art = artFor(slot, kind);
  if (!art) return null;
  return (
    <g
      style={onTap ? { cursor: 'pointer' } : undefined}
      onPointerDown={
        onTap
          ? (e) => {
              e.stopPropagation();
              onTap(slot);
            }
          : undefined
      }
    >
      {art.node(color)}
    </g>
  );
}

export function CreatureSVG({
  look,
  alive = true,
  onTapItem,
  onTapBody,
  className,
}: {
  look: Look;
  /** Idle animations. Off for thumbnails and when the child prefers less motion. */
  alive?: boolean;
  onTapItem?: (slot: Slot) => void;
  onTapBody?: () => void;
  className?: string;
}) {
  const body = look.body;
  const belly = tint(body, 0.45);
  const line = darken(body, 0.22);
  const mane = look.mane;
  const maneDeep = darken(mane, 0.16);

  const anim = (c: string) => (alive ? c : undefined);

  return (
    <svg viewBox={VIEW} className={className} onPointerDown={onTapBody} aria-hidden style={{ overflow: 'visible' }}>
      {/* ---- behind her ---- */}
      {/* tinted from her mane rather than white, so they still read against a
          pale sky */}
      <g className={anim('cc-du-flutter')}>
        <path d="M106 194 C 64 196 30 168 26 122 C 66 126 98 152 110 186 Z" fill={tint(mane, 0.66)} stroke={tint(mane, 0.24)} strokeWidth="3" />
        <path d="M194 194 C 236 196 270 168 274 122 C 234 126 202 152 190 186 Z" fill={tint(mane, 0.66)} stroke={tint(mane, 0.24)} strokeWidth="3" />
        {look.wings && <Worn slot="wings" kind={look.wings.kind} color={look.wings.color} onTap={onTapItem} />}
      </g>

      <g className={anim('cc-du-tail')}>
        <path
          d="M206 262 C 252 270 272 238 258 212 C 246 190 218 196 218 218 C 218 234 238 240 246 228"
          stroke={mane}
          strokeWidth="15"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="246" cy="228" r="11" fill={maneDeep} />
      </g>

      {look.outfit?.kind === 'cape' && (
        <Worn slot="outfit" kind="cape" color={look.outfit.color} onTap={onTapItem} />
      )}

      {/* ---- legs and feet ---- */}
      <g>
        <rect x="122" y="264" width="21" height="66" rx="10.5" fill={body} stroke={line} strokeWidth="2" />
        <rect x="157" y="264" width="21" height="66" rx="10.5" fill={body} stroke={line} strokeWidth="2" />
        <ellipse cx="132" cy="330" rx="14" ry="8" fill={belly} stroke={line} strokeWidth="2" />
        <ellipse cx="168" cy="330" rx="14" ry="8" fill={belly} stroke={line} strokeWidth="2" />
      </g>
      {look.shoes && <Worn slot="shoes" kind={look.shoes.kind} color={look.shoes.color} onTap={onTapItem} />}

      {/* ---- body ---- */}
      <g className={anim('cc-du-breathe')}>
        <path
          d="M150 172 C 196 172 218 204 218 236 C 218 274 188 292 150 292 C 112 292 82 274 82 236 C 82 204 104 172 150 172 Z"
          fill={body}
          stroke={line}
          strokeWidth="2.5"
        />
        <ellipse cx="150" cy="250" rx="40" ry="30" fill={belly} />
        {look.outfit && look.outfit.kind !== 'cape' && (
          <Worn slot="outfit" kind={look.outfit.kind} color={look.outfit.color} onTap={onTapItem} />
        )}
        <ellipse cx="86" cy="228" rx="13" ry="19" fill={body} stroke={line} strokeWidth="2" transform="rotate(-12 86 228)" />
        <ellipse cx="214" cy="228" rx="13" ry="19" fill={body} stroke={line} strokeWidth="2" transform="rotate(12 214 228)" />
      </g>

      {/* ---- head ---- */}
      <g>
        <path d="M112 96 q -14 -24 6 -30 q 12 -2 16 18 Z" fill={body} stroke={line} strokeWidth="2" strokeLinejoin="round" />
        <path d="M188 96 q 14 -24 -6 -30 q -12 -2 -16 18 Z" fill={body} stroke={line} strokeWidth="2" strokeLinejoin="round" />

        {/* mane behind the head, then the head, then the forelock over it */}
        <g className={anim('cc-du-sway')}>
          <path
            d="M194 100 C 228 92 240 130 226 158 C 244 178 228 210 202 208 C 214 180 200 148 184 136 Z"
            fill={mane}
            stroke={maneDeep}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>

        <circle cx="150" cy="132" r="56" fill={body} stroke={line} strokeWidth="2.5" />
        <ellipse cx="150" cy="158" rx="26" ry="18" fill={belly} />
        <ellipse cx="110" cy="152" rx="11" ry="7" fill="#F49CC0" opacity="0.45" />
        <ellipse cx="190" cy="152" rx="11" ry="7" fill="#F49CC0" opacity="0.45" />
        <circle cx="143" cy="152" r="2.6" fill={line} />
        <circle cx="157" cy="152" r="2.6" fill={line} />
        <path d="M138 163 q 12 12 24 0" stroke={line} strokeWidth="3" fill="none" strokeLinecap="round" />

        <g data-eye className={anim('cc-du-blink')}>
          <ellipse cx="130" cy="133" rx="12" ry="13.5" fill="#FFFFFF" />
          <ellipse cx="170" cy="133" rx="12" ry="13.5" fill="#FFFFFF" />
          <circle cx="131" cy="135" r="7.5" fill="#3E3340" />
          <circle cx="171" cy="135" r="7.5" fill="#3E3340" />
          <circle cx="127.5" cy="130" r="3" fill="#FFFFFF" />
          <circle cx="167.5" cy="130" r="3" fill="#FFFFFF" />
        </g>

        <g className={anim('cc-du-sway')}>
          <path
            d="M118 108 C 120 78 140 62 152 62 C 142 80 146 94 136 110 C 131 118 120 118 118 108 Z"
            fill={mane}
            stroke={maneDeep}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M156 62 C 172 66 184 82 182 100 C 174 88 166 78 152 74 Z"
            fill={maneDeep}
          />
        </g>

        {look.face && <Worn slot="face" kind={look.face.kind} color={look.face.color} onTap={onTapItem} />}
        {look.head && <Worn slot="head" kind={look.head.kind} color={look.head.color} onTap={onTapItem} />}

        {/* the horn goes in front, so a crown reads as sitting around it */}
        <path d="M142 86 L150 20 L158 86 Z" fill="#FFF0C9" stroke="#E9D296" strokeWidth="2" strokeLinejoin="round" />
        <path d="M144 74 L156 70 M145.5 62 L154.5 58 M147 50 L153.5 47" stroke="#E9D296" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
