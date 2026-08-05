import type { FC } from 'react';

/**
 * Six hand-drawn scenes, one per screen. Everything is inline SVG in a shared
 * 400x300 space, so the story is a flipbook rather than six little apps.
 *
 * `beat` runs 0 -> 1 after each tap: every scene uses it for its one moment of
 * movement (the lift-off, the landing puff, the fish's loop). At `beat` 0 the
 * scene simply sits there, which is what a child who is not tapping should see.
 */

export interface SceneProps {
  beat: number;
  reduceMotion: boolean;
  /** The child's colour, so the rocket is painted in it. */
  accent: string;
  accentDeep: string;
  name: string;
}

const STARS: Array<[number, number, number]> = [
  [28, 40, 2.4], [86, 22, 1.6], [150, 58, 2], [212, 30, 1.4], [268, 66, 2.2],
  [330, 26, 1.8], [372, 74, 1.5], [58, 96, 1.5], [116, 128, 1.2], [246, 116, 1.7],
  [352, 140, 1.3], [180, 96, 1.2], [300, 160, 1.5], [40, 158, 1.4],
];

function StarField({ twinkle }: { twinkle: boolean }) {
  return (
    <g>
      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFFBF2" opacity={twinkle ? undefined : 0.85}>
          {twinkle && (
            <animate
              attributeName="opacity"
              values="0.35;1;0.35"
              dur={`${2.2 + (i % 5) * 0.6}s`}
              repeatCount="indefinite"
              begin={`${(i % 7) * 0.3}s`}
            />
          )}
        </circle>
      ))}
    </g>
  );
}

function NightSky({ twinkle }: { twinkle: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id="cc-mf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#221F4B" />
          <stop offset="1" stopColor="#4B4383" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#cc-mf-sky)" />
      <StarField twinkle={twinkle} />
    </>
  );
}

/** A small round-nosed rocket, nose up. */
function Rocket({ accent, accentDeep, scale = 1 }: { accent: string; accentDeep: string; scale?: number }) {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M0 -46 C 16 -30 22 -6 20 16 L -20 16 C -22 -6 -16 -30 0 -46 Z" fill={accent} />
      <path d="M0 -46 C 8 -32 12 -12 11 16 L -11 16 C -12 -12 -8 -32 0 -46 Z" fill="#FFFFFF" opacity="0.22" />
      <path d="M-20 16 L -34 34 L -12 26 Z" fill={accentDeep} />
      <path d="M20 16 L 34 34 L 12 26 Z" fill={accentDeep} />
      <circle cx="0" cy="-14" r="10" fill="#CFEFFF" stroke="#FFFFFF" strokeWidth="3" />
      <rect x="-11" y="16" width="22" height="8" rx="3" fill={accentDeep} />
    </g>
  );
}

function Flame({ beat }: { beat: number }) {
  const s = 0.6 + beat * 0.9;
  return (
    <g transform={`translate(0 28) scale(${s})`} opacity={beat > 0 ? 1 : 0.75}>
      <path d="M0 26 C -10 10 -7 0 0 -4 C 7 0 10 10 0 26 Z" fill="#FFC24B" />
      <path d="M0 18 C -5 8 -4 2 0 0 C 4 2 5 8 0 18 Z" fill="#FFF0B8" />
    </g>
  );
}

/** The moon, cratered, with room to stand on top. */
function Moon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#F6EFD8" />
      <circle cx={cx - r * 0.34} cy={cy - r * 0.2} r={r * 0.16} fill="#E4D9BC" />
      <circle cx={cx + r * 0.28} cy={cy + r * 0.12} r={r * 0.11} fill="#E4D9BC" />
      <circle cx={cx + r * 0.02} cy={cy + r * 0.42} r={r * 0.08} fill="#E4D9BC" />
    </g>
  );
}

/** The moon fish: round, finned, and pleased to see you. */
function MoonFish({ scale = 1, blink = false }: { scale?: number; blink?: boolean }) {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M26 0 L48 -18 L48 18 Z" fill="#7FC9E8" />
      <ellipse cx="0" cy="0" rx="30" ry="24" fill="#A9DDF2" />
      <ellipse cx="-6" cy="6" rx="18" ry="12" fill="#E6F7FF" opacity="0.7" />
      <path d="M-2 -22 Q 8 -34 18 -20 Z" fill="#7FC9E8" />
      <circle cx="-14" cy="-5" r="6" fill="#FFFFFF" />
      <circle cx="-15" cy="-5" r={blink ? 0.6 : 3.2} fill="#33324A" />
      <path d="M-24 6 q 6 6 12 1" stroke="#5FA9C6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ------------------------------------------------------------------ scenes ---

/** 1 — the rocket waits in the garden. */
const Launchpad: FC<SceneProps> = ({ beat, accent, accentDeep }) => (
  <g>
    <NightSky twinkle />
    <Moon cx={330} cy={56} r={26} />
    <path d="M0 246 q 100 -26 200 -6 q 100 20 200 -4 v 64 H0 Z" fill="#3D6B52" />
    <path d="M0 268 q 120 -18 200 0 q 90 20 200 -2 v 34 H0 Z" fill="#2F5842" />
    <g transform={`translate(140 ${232 - beat * 150})`}>
      <Flame beat={beat} />
      <Rocket accent={accent} accentDeep={accentDeep} />
    </g>
  </g>
);

/** 2 — up through the stars. */
const Climbing: FC<SceneProps> = ({ beat, accent, accentDeep }) => (
  <g>
    <NightSky twinkle />
    <g transform={`translate(${150 + beat * 60} ${190 - beat * 40}) rotate(${12 + beat * 6})`}>
      <Flame beat={0.8} />
      <Rocket accent={accent} accentDeep={accentDeep} />
    </g>
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={90 + i * 26} cy={236 + i * 14} r={4 - i} fill="#FFFBF2" opacity={0.5 - i * 0.14} />
    ))}
  </g>
);

/** 3 — the moon fills the window. */
const Arriving: FC<SceneProps> = ({ beat, accent, accentDeep }) => (
  <g>
    <NightSky twinkle={false} />
    <Moon cx={210} cy={210 - beat * 8} r={110 + beat * 10} />
    <g transform={`translate(${318 - beat * 30} ${96 + beat * 24}) rotate(${140})`}>
      <Rocket accent={accent} accentDeep={accentDeep} scale={0.7} />
    </g>
  </g>
);

/** 4 — touchdown, with a puff of moon dust. */
const Landing: FC<SceneProps> = ({ beat, accent, accentDeep }) => (
  <g>
    <NightSky twinkle={false} />
    <circle cx="200" cy="430" r="240" fill="#F6EFD8" />
    <circle cx="96" cy="252" r="18" fill="#E4D9BC" />
    <circle cx="318" cy="266" r="12" fill="#E4D9BC" />
    <g transform="translate(200 196)">
      <Rocket accent={accent} accentDeep={accentDeep} scale={0.92} />
    </g>
    {beat > 0 && (
      <g opacity={1 - beat}>
        {[-1, 1].map((s) => (
          <ellipse key={s} cx={200 + s * (26 + beat * 44)} cy={226} rx={26 + beat * 20} ry={9} fill="#FFFFFF" opacity="0.75" />
        ))}
      </g>
    )}
  </g>
);

/** 5 — the moon fish comes out to say hello. */
const Meeting: FC<SceneProps> = ({ beat, accent, accentDeep }) => (
  <g>
    <NightSky twinkle={false} />
    <circle cx="200" cy="430" r="240" fill="#F6EFD8" />
    <g transform="translate(96 208)">
      <Rocket accent={accent} accentDeep={accentDeep} scale={0.66} />
    </g>
    <g transform={`translate(268 ${186 - beat * 26}) rotate(${beat * 360})`}>
      <MoonFish scale={1.15} />
    </g>
    {beat > 0 &&
      [0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={300 + i * 12}
          cy={176 - beat * (40 + i * 16)}
          r={5 - i * 0.7}
          fill="#FFFFFF"
          opacity={(1 - beat) * 0.8}
        />
      ))}
  </g>
);

/** 6 — the two of them, and whose story it was. */
const Together: FC<SceneProps> = ({ beat, accent, accentDeep, name }) => (
  <g>
    <NightSky twinkle />
    <circle cx="200" cy="440" r="230" fill="#F6EFD8" />
    <g transform="translate(146 214)">
      <Rocket accent={accent} accentDeep={accentDeep} scale={0.66} />
    </g>
    <g transform="translate(252 206)">
      <MoonFish scale={0.95} blink={beat > 0.45 && beat < 0.6} />
    </g>
    <text
      x="200"
      y="92"
      textAnchor="middle"
      fontSize="34"
      fontWeight="600"
      fill="#FFFBF2"
      fontFamily="Fredoka, ui-rounded, sans-serif"
      opacity={0.35 + beat * 0.65}
    >
      {name}
    </text>
  </g>
);

export const SCENES: Array<FC<SceneProps>> = [
  Launchpad,
  Climbing,
  Arriving,
  Landing,
  Meeting,
  Together,
];
