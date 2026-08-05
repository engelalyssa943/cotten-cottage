import { useHold } from './useHold';

/**
 * The one way out of a game.
 *
 * This is a LANE, not a floating corner button, and that is the whole point.
 * When it floated over the games it sat on top of whichever control happened to
 * be in that corner — the cake's first topper, the dress-up tray's first piece,
 * the aquarium's first fish — and there is no corner that is free in every game:
 * the trays are content-width, so a spot that clears them on a big screen is
 * inside them on a smaller one. Owning a column instead makes overlap
 * impossible, for the games that exist and the ones that don't yet.
 *
 * The lane is `--cc-rail` wide. Games paint their background across the full
 * width and inset only their controls by it, so this is frosted glass lying on
 * top of the tank or the pond rather than a coloured stripe cut out beside it.
 *
 * It stays a hold rather than a tap so a 1-year-old slapping the screen can't
 * fall out of a game, and an in-progress cake can't be lost by accident. A
 * gentle ring fills while held.
 */
export function ExitRail({ onExit }: { onExit: () => void }) {
  const { progress, bind } = useHold(onExit, 1100);
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div
      className="absolute inset-y-0 left-0 z-30 flex w-[var(--cc-rail)] flex-col items-center justify-end pb-5 bg-white/25 backdrop-blur-md"
    >
      <button
        {...bind}
        aria-label="Leave"
        className="relative grid h-16 w-16 place-items-center rounded-full bg-white/80 shadow-md"
        style={{ touchAction: 'none' }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="var(--cc-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
        {progress > 0 && (
          <svg viewBox="0 0 60 60" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
            <circle cx="30" cy="30" r={R} fill="none" stroke="var(--cc-accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
        )}
      </button>
    </div>
  );
}
