import { useState } from 'react';
import { useHold } from './useHold';

/**
 * The way in to the grown-up area, available on every screen the children see.
 *
 * It used to be an invisible hotspot in the bottom corner, rendered only on the
 * cottage and the profile picker — so once a child was inside a room or a game
 * there was no way to reach the settings at all without backing all the way
 * out, and no way to discover it in the first place. Now it is a real button,
 * in the lane the app owns, on every screen.
 *
 * Visible does not mean open. Two things stand in the way of a five-year-old,
 * and they do different jobs:
 *
 *  - It is a HOLD, not a tap. A child who prods it gets nothing at all, so she
 *    is never staring at a keypad she can't use. The ring that starts filling
 *    under an adult's finger is what teaches the adult to keep holding — which
 *    is why the button can be obvious without being a way in.
 *  - Behind it is arithmetic she has years to go before she can do. That is the
 *    actual lock; the hold is only there to keep the dialog out of her way.
 *
 * Deliberately not a PIN: PINs get watched over your shoulder and remembered.
 * A wrong answer just clears, because the person typing is an adult and locking
 * them out of their own tablet helps nobody.
 */
export function ParentGate({ onPass }: { onPass: () => void }) {
  const [challenge, setChallenge] = useState<{ a: number; b: number } | null>(null);
  const [entry, setEntry] = useState('');
  const [shake, setShake] = useState(false);

  const { progress, bind } = useHold(() => {
    setChallenge({ a: 11 + Math.floor(Math.random() * 88), b: 3 + Math.floor(Math.random() * 6) });
    setEntry('');
  }, 1500);

  function press(d: string) {
    if (d === '⌫') setEntry((e) => e.slice(0, -1));
    else if (entry.length < 4) setEntry((e) => e + d);
  }

  function submit() {
    if (!challenge) return;
    if (Number(entry) === challenge.a * challenge.b) {
      setChallenge(null);
      setEntry('');
      onPass();
    } else {
      setShake(true);
      setEntry('');
      window.setTimeout(() => setShake(false), 400);
    }
  }

  const R = 28;
  const C = 2 * Math.PI * R;

  return (
    <>
      {/* Top of the left lane: the one strip of screen no game may lay out into,
          so this sits in the same place everywhere and covers nothing. */}
      <button
        {...bind}
        aria-label="Grown-ups"
        className="fixed left-[10px] top-[10px] z-40 grid h-16 w-16 place-items-center rounded-full bg-white/40 shadow-sm backdrop-blur-sm active:bg-white/70"
        style={{ touchAction: 'none' }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="var(--cc-ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
          <rect x="5" y="11" width="14" height="9" rx="2.5" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {progress > 0 && (
          <svg viewBox="0 0 64 64" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="var(--cc-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
        )}
      </button>

      {challenge && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-6">
          <div className={`w-80 rounded-cozy bg-white p-6 shadow-2xl ${shake ? 'cc-shake' : ''}`}>
            <div className="mb-1 text-center text-sm text-ink/50">Grown-ups only</div>
            <div className="mb-4 text-center text-3xl font-semibold text-ink">
              {challenge.a} × {challenge.b}
            </div>
            <div className="mb-4 h-12 rounded-cozy bg-cream text-center text-2xl leading-[3rem] text-ink">
              {entry || ' '}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((k) => (
                <button
                  key={k}
                  onClick={() => (k === '✓' ? submit() : press(k))}
                  className="h-14 rounded-cozy bg-cc-100 text-xl font-semibold text-ink shadow-sm active:scale-95"
                >
                  {k}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setChallenge(null);
                setEntry('');
              }}
              className="mt-3 w-full rounded-pill py-2 text-sm text-ink/50"
            >
              close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
