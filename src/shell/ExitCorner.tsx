import { useHold } from './useHold';

/**
 * The one way out of a game. Rendered by the app over every game so games never
 * render their own back button. It's a hold (not a tap) so a 1-year-old slapping
 * the screen can't fall out of a game, and an in-progress cake can't be lost by
 * accident. A gentle ring fills while held.
 */
export function ExitCorner({ onExit }: { onExit: () => void }) {
  const { progress, bind } = useHold(onExit, 1100);
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <button
      {...bind}
      aria-label="Leave"
      className="fixed bottom-4 left-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-white/75 shadow-md backdrop-blur"
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
  );
}
