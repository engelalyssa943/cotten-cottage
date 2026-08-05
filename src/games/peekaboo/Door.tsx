import type { ResolvedTheme } from '../../engine/types';
import { AnimalSVG, type Animal } from './animals';

/**
 * One cupboard: a recess with somebody in it, and a door that swings open on a
 * hinge. Shared by both bands, because the door is the whole toy — the
 * difference between a one-year-old and a three-year-old is what you're
 * looking for behind it, not how it opens.
 *
 * The whole square is the target. There is no knob to hit, no edge to miss.
 */
export function Door({
  animal,
  open,
  size,
  theme,
  reduceMotion,
  delay,
  onTap,
}: {
  animal: Animal;
  open: boolean;
  size: number;
  theme: ResolvedTheme;
  reduceMotion: boolean;
  delay: number;
  onTap: () => void;
}) {
  return (
    <button
      onPointerDown={onTap}
      className="relative shrink-0 touch-none"
      style={{ width: size, height: size, perspective: 900 }}
      aria-label={open ? 'Close the cupboard' : 'Open the cupboard'}
    >
      {/* the cubby, and whoever is sitting in it */}
      <span
        className="absolute inset-0 grid place-items-center overflow-hidden rounded-cozy"
        style={{ background: '#4A3428', boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.45)' }}
      >
        <span
          className="absolute inset-x-0 bottom-0"
          style={{ height: size * 0.14, background: '#6A4B37' }}
        />
        <AnimalSVG animal={animal} size={size * 0.62} still={reduceMotion} delay={delay} />
      </span>

      {/* the door itself */}
      <span
        className="absolute inset-0 rounded-cozy"
        style={{
          transformOrigin: 'left center',
          transform: reduceMotion ? undefined : `rotateY(${open ? -108 : 0}deg)`,
          opacity: reduceMotion && open ? 0 : 1,
          transition: reduceMotion
            ? 'opacity 260ms ease'
            : 'transform 520ms cubic-bezier(0.34, 1.2, 0.5, 1)',
          background: `linear-gradient(150deg, ${theme.scale[300]}, ${theme.scale[500]})`,
          boxShadow: '0 6px 14px rgba(0,0,0,0.22)',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* a sunken panel and a knob, so it reads as a cupboard door */}
        <span
          className="absolute rounded-cozy"
          style={{
            inset: size * 0.11,
            border: `${Math.max(3, size * 0.022)}px solid ${theme.scale[600]}`,
            opacity: 0.55,
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            width: size * 0.11,
            height: size * 0.11,
            right: size * 0.07,
            top: '50%',
            transform: 'translateY(-50%)',
            background: '#FFFBF2',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </span>
    </button>
  );
}
