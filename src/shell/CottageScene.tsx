import type { ResolvedTheme, Room } from '../engine/types';
import { ROOM_ORDER } from '../engine/rooms';
import type { DayPhase, Weather } from './time';

/**
 * The cutaway dollhouse — the whole navigation. Only the rooms present for this
 * child are drawn; an empty room is simply absent, so the house literally grows as
 * games are added. Hand-drawn-feeling SVG, painted from the child's theme, with a
 * cosmetic sky (time of day + weather). No grid of tiles, no text list.
 */

interface Props {
  rooms: Room[];
  childName: string;
  theme: ResolvedTheme;
  phase: DayPhase;
  weather: Weather;
  doorIsNew: boolean;
  reduceMotion: boolean;
  onEnter: (room: Room) => void;
}

const ROOM_LABEL: Record<Room, string> = {
  kitchen: 'Kitchen',
  workshop: 'Workshop',
  sunroom: 'Sunroom',
  garden: 'Garden',
  attic: 'Attic',
  door: "Aunt Alyssa's Door",
};

const SKY: Record<DayPhase, [string, string]> = {
  morning: ['#FBE7D6', '#CDE7F5'],
  day: ['#CFEBFA', '#EAF6FF'],
  dusk: ['#F6C9A8', '#B79AD1'],
  night: ['#2B2E5A', '#4A4E86'],
};

const AUNT_DOOR = '#E58FC0'; // Aunt Alyssa's door is always her color, not the child's.
const AUNT_DOOR_DEEP = '#C56BA2';

function Zone({
  label,
  onEnter,
  children,
}: {
  label: string;
  onEnter: () => void;
  children: React.ReactNode;
}) {
  return (
    <g
      className="cc-zone"
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEnter();
      }}
    >
      {children}
    </g>
  );
}

export function CottageScene({
  rooms,
  childName,
  theme,
  phase,
  weather,
  doorIsNew,
  reduceMotion,
  onEnter,
}: Props) {
  const present = new Set(rooms);
  const interior = ROOM_ORDER.filter(
    (r) => present.has(r) && (r === 'kitchen' || r === 'workshop' || r === 'sunroom'),
  );

  const groundY = 470;
  const cx = 500;
  const cw = 150;
  const chH = 150;
  const gap = 14;
  const wallPad = 24;
  const floorPad = 26;
  const n = Math.max(1, interior.length);
  const bodyInnerW = n * cw + (n - 1) * gap;
  const bodyW = bodyInnerW + wallPad * 2;
  const bodyH = chH + floorPad * 2;
  const bodyX = cx - bodyW / 2;
  const bodyY = groundY - bodyH;
  const roofH = present.has('attic') ? 168 : 120;
  const roofPeakY = bodyY - roofH;
  const startX = bodyX + wallPad;
  const isDark = phase === 'night' || phase === 'dusk';
  const [sky0, sky1] = SKY[phase];

  return (
    <svg
      viewBox="0 0 1000 620"
      className={`h-full w-full ${reduceMotion ? 'cc-reduce' : ''}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky0} />
          <stop offset="1" stopColor={sky1} />
        </linearGradient>
        <linearGradient id="cc-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BEE7F5" />
          <stop offset="1" stopColor="#7FC6E6" />
        </linearGradient>
        <linearGradient id="cc-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.scale[400]} />
          <stop offset="1" stopColor={theme.scale[600]} />
        </linearGradient>
        <filter id="cc-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#00000022" />
        </filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="1000" height="620" fill="url(#cc-sky)" />

      {/* Sun / moon */}
      {phase === 'night' ? (
        <g>
          <circle cx="820" cy="120" r="46" fill="#F4EFD6" />
          <circle cx="805" cy="108" r="46" fill={sky0} opacity="0.7" />
        </g>
      ) : (
        <circle
          cx={phase === 'morning' ? 760 : phase === 'dusk' ? 250 : 820}
          cy={phase === 'dusk' ? 300 : 120}
          r="52"
          fill={phase === 'dusk' ? '#F6A96B' : '#FCE59A'}
        />
      )}

      {/* Stars at night */}
      {isDark &&
        [
          [120, 90],
          [260, 60],
          [420, 110],
          [620, 70],
          [700, 150],
          [900, 210],
          [180, 200],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 2.5 : 3.5} fill="#FFFDF2" opacity="0.9" />
        ))}

      {/* Clouds */}
      {!isDark &&
        [
          [180, 130, 1],
          [640, 90, 0.85],
        ].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.92">
            <ellipse cx="0" cy="0" rx="46" ry="26" fill="#FFFFFF" />
            <ellipse cx="38" cy="8" rx="34" ry="22" fill="#FFFFFF" />
            <ellipse cx="-36" cy="10" rx="30" ry="20" fill="#FFFFFF" />
          </g>
        ))}

      {/* Rain (cosmetic, and calmed under reduce-motion) */}
      {weather === 'rain' &&
        [140, 300, 470, 690, 860].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={180 + (i % 3) * 20}
            x2={x - 10}
            y2={210 + (i % 3) * 20}
            stroke="#9FC7DE"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          >
            {!reduceMotion && (
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.6s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
            )}
          </line>
        ))}

      {/* Ground */}
      <path
        d={`M0 ${groundY} Q 250 ${groundY - 24} 500 ${groundY} T 1000 ${groundY} V 620 H 0 Z`}
        fill={phase === 'night' ? '#4E6E4A' : '#93C982'}
      />
      <path
        d={`M0 ${groundY + 26} Q 250 ${groundY + 4} 500 ${groundY + 26} T 1000 ${groundY + 26} V 620 H 0 Z`}
        fill={phase === 'night' ? '#3F5C3D' : '#7FB870'}
        opacity="0.6"
      />

      {/* ---------- Aunt Alyssa's Door (left yard, always her color) ---------- */}
      {present.has('door') && (
        <Zone label={ROOM_LABEL.door} onEnter={() => onEnter('door')}>
          <g transform="translate(150 320)" filter="url(#cc-soft)">
            <rect x="-4" y="-4" width="108" height="162" rx="26" fill={AUNT_DOOR_DEEP} />
            <rect x="4" y="4" width="92" height="150" rx="22" fill={AUNT_DOOR} />
            <circle cx="78" cy="80" r="6" fill="#FFF3D6" />
            <rect x="20" y="26" width="26" height="40" rx="8" fill="#FFFFFF" opacity="0.35" />
            <rect x="54" y="26" width="26" height="40" rx="8" fill="#FFFFFF" opacity="0.35" />
            {doorIsNew && (
              <>
                <g transform="translate(50 -22)">
                  <rect x="-46" y="-16" width="92" height="30" rx="15" fill="#F2C94C" />
                  <text x="0" y="5" textAnchor="middle" fontSize="18" fontWeight="700" fill="#7A5A12">
                    new!
                  </text>
                </g>
                {[
                  [-16, 40],
                  [104, 60],
                  [96, 120],
                ].map(([sx, sy], i) => (
                  <g key={i} transform={`translate(${sx} ${sy})`}>
                    <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#FFF3B0">
                      {!reduceMotion && (
                        <animateTransform attributeName="transform" type="scale" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" begin={`${i * 0.4}s`} additive="sum" />
                      )}
                    </path>
                  </g>
                ))}
              </>
            )}
          </g>
        </Zone>
      )}

      {/* ---------- Garden (right yard) ---------- */}
      {present.has('garden') && (
        <Zone label={ROOM_LABEL.garden} onEnter={() => onEnter('garden')}>
          <g transform="translate(806 300)" filter="url(#cc-soft)">
            {/* soft patch */}
            <ellipse cx="40" cy="176" rx="120" ry="26" fill="#8AC178" opacity="0.55" />
            {/* little tree */}
            <rect x="30" y="96" width="18" height="80" rx="9" fill="#B0794E" />
            <circle cx="39" cy="86" r="46" fill="#8BC97A" />
            <circle cx="14" cy="100" r="30" fill="#7FBE6E" />
            <circle cx="66" cy="100" r="30" fill="#96D086" />
            {/* flowers */}
            {[
              [-30, 168, '#F49AC1'],
              [104, 176, '#F6C453'],
              [140, 150, '#B99BE6'],
            ].map(([fx, fy, c], i) => (
              <g key={i} transform={`translate(${fx} ${fy})`}>
                <rect x="-2" y="0" width="4" height="26" rx="2" fill="#5FA05A" />
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 9} cy={Math.sin((a * Math.PI) / 180) * 9} r="6" fill={c as string} />
                ))}
                <circle cx="0" cy="0" r="5" fill="#FCE59A" />
              </g>
            ))}
          </g>
        </Zone>
      )}

      {/* ---------- The house ---------- */}
      <g filter="url(#cc-soft)">
        {/* roof */}
        <path
          d={`M${bodyX - 22} ${bodyY + 8} Q ${cx} ${roofPeakY - 10} ${bodyX + bodyW + 22} ${bodyY + 8} Z`}
          fill="url(#cc-roof)"
        />
        {/* chimney */}
        <rect x={bodyX + bodyW - 60} y={roofPeakY + 34} width="30" height="60" rx="8" fill={theme.scale[700]} />
        {weather !== 'rain' &&
          [0, 1, 2].map((i) => (
            <circle key={i} cx={bodyX + bodyW - 45} cy={roofPeakY + 20 - i * 16} r={7 + i * 2} fill="#FFFFFF" opacity={0.5 - i * 0.12}>
              {!reduceMotion && (
                <animate attributeName="cy" values={`${roofPeakY + 20 - i * 16};${roofPeakY - 20 - i * 16}`} dur="3s" repeatCount="indefinite" begin={`${i * 0.6}s`} />
              )}
            </circle>
          ))}

        {/* body */}
        <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="26" fill={theme.paint} />
        <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="26" fill="none" stroke={theme.scale[300]} strokeWidth="3" />

        {/* attic round window + telescope (roof is the attic zone) */}
        {present.has('attic') && (
          <Zone label={ROOM_LABEL.attic} onEnter={() => onEnter('attic')}>
            <circle cx={cx} cy={bodyY - roofH * 0.4} r="40" fill="#FDF6E3" stroke={theme.scale[600]} strokeWidth="6" />
            <g transform={`translate(${cx} ${bodyY - roofH * 0.4})`}>
              <rect x="-4" y="-2" width="34" height="12" rx="6" fill={theme.scale[700]} transform="rotate(-28)" />
              <circle cx="-14" cy="-14" r="3" fill="#F2C94C" />
              <circle cx="16" cy="-18" r="2.4" fill="#F2C94C" />
            </g>
          </Zone>
        )}
      </g>

      {/* interior compartments (only the present interior rooms) */}
      {interior.map((room, i) => {
        const x = startX + i * (cw + gap);
        const y = bodyY + floorPad;
        return (
          <Zone key={room} label={ROOM_LABEL[room]} onEnter={() => onEnter(room)}>
            <g className={reduceMotion ? '' : 'cc-room-in'}>
              {/* room back wall + warm glow at dusk/night */}
              <rect x={x} y={y} width={cw} height={chH} rx="18" fill={isDark ? theme.scale[200] : theme.scale[100]} />
              {isDark && <rect x={x} y={y} width={cw} height={chH} rx="18" fill="#FFE9A8" opacity="0.22" />}
              {/* floor */}
              <rect x={x} y={y + chH - 26} width={cw} height="26" rx="8" fill="#D9B88C" />
              {roomMotif(room, x, y, cw, chH, theme)}
            </g>
          </Zone>
        );
      })}

      {/* name plaque hanging from the eave */}
      <g transform={`translate(${cx} ${bodyY - 6})`}>
        <rect x="-2" y="-2" width="4" height="14" fill={theme.scale[700]} />
        <g transform="translate(0 30)">
          <rect x={-Math.max(70, childName.length * 12) / 2} y="-24" width={Math.max(70, childName.length * 12)} height="42" rx="16" fill="#FFFDF6" stroke={theme.scale[400]} strokeWidth="3" />
          <text x="0" y="4" textAnchor="middle" fontSize="24" fontWeight="600" fill={theme.ink} fontFamily="Fredoka, ui-rounded, sans-serif">
            {childName}
          </text>
        </g>
      </g>
    </svg>
  );
}

/** Small recognizable scene per interior room, drawn inside the compartment box. */
function roomMotif(room: Room, x: number, y: number, w: number, h: number, theme: ResolvedTheme) {
  const cx = x + w / 2;
  if (room === 'sunroom') {
    const tx = x + 18;
    const ty = y + 20;
    const tw = w - 36;
    const th = h - 62;
    return (
      <g>
        <rect x={tx} y={ty} width={tw} height={th} rx="14" fill="url(#cc-water)" stroke="#6FB2D6" strokeWidth="3" />
        <rect x={tx + 4} y={ty + th - 14} width={tw - 8} height="12" rx="6" fill="#E7CE8F" />
        {/* fish */}
        <g transform={`translate(${tx + tw * 0.36} ${ty + th * 0.4})`}>
          <ellipse cx="0" cy="0" rx="16" ry="11" fill="#F19A5A" />
          <path d="M14 0 L26 -9 L26 9 Z" fill="#EC824A" />
          <circle cx="-7" cy="-2" r="2.4" fill="#38343a" />
        </g>
        <g transform={`translate(${tx + tw * 0.68} ${ty + th * 0.62})`}>
          <ellipse cx="0" cy="0" rx="12" ry="8" fill={theme.scale[500]} />
          <path d="M10 0 L20 -7 L20 7 Z" fill={theme.scale[600]} />
          <circle cx="-5" cy="-1" r="2" fill="#38343a" />
        </g>
        <circle cx={tx + tw * 0.5} cy={ty + 16} r="3" fill="#FFFFFF" opacity="0.8" />
        <circle cx={tx + tw * 0.55} cy={ty + 28} r="2" fill="#FFFFFF" opacity="0.7" />
      </g>
    );
  }
  if (room === 'kitchen') {
    return (
      <g transform={`translate(${cx} ${y + h * 0.52})`}>
        {/* cupcake */}
        <path d="M-26 6 L26 6 L20 44 L-20 44 Z" fill="#F2D2A6" />
        <path d="M-26 6 L26 6 L23 18 L-23 18 Z" fill="#E7B885" />
        <path d="M-28 6 Q -28 -34 0 -34 Q 28 -34 28 6 Z" fill="#F7B4CE" />
        <circle cx="0" cy="-30" r="6" fill="#E4585E" />
        {/* sprinkles */}
        {[[-12, -6], [8, -12], [-2, -18], [14, -2]].map(([sx, sy], i) => (
          <rect key={i} x={sx} y={sy} width="6" height="3" rx="1.5" fill={i % 2 ? theme.scale[500] : '#8FC98A'} transform={`rotate(${i * 40} ${sx} ${sy})`} />
        ))}
      </g>
    );
  }
  if (room === 'workshop') {
    return (
      <g transform={`translate(${cx} ${y + h * 0.5})`}>
        <rect x="-34" y="6" width="30" height="30" rx="6" fill={theme.scale[500]} />
        <rect x="0" y="6" width="30" height="30" rx="6" fill="#8FC98A" />
        <rect x="-18" y="-26" width="30" height="30" rx="6" fill="#F2C94C" />
      </g>
    );
  }
  return null;
}
