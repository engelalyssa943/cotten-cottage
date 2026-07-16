import { useState } from 'react';
import { useHold } from './useHold';

/**
 * The grown-up gate: hold the bottom corner for 3 seconds, then answer a
 * two-digit × one-digit multiplication. Not a PIN — PINs get watched and
 * memorized. A wrong answer just gently clears; there is no lockout (it's an
 * adult), and nothing here is child-hittable.
 */
export function ParentGate({ onPass }: { onPass: () => void }) {
  const [challenge, setChallenge] = useState<{ a: number; b: number } | null>(null);
  const [entry, setEntry] = useState('');
  const [shake, setShake] = useState(false);

  const { progress, bind } = useHold(() => {
    setChallenge({ a: 11 + Math.floor(Math.random() * 88), b: 3 + Math.floor(Math.random() * 6) });
    setEntry('');
  }, 3000);

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

  return (
    <>
      {/* Invisible corner hotspot with a hold-progress ring. */}
      <div
        {...bind}
        className="fixed bottom-0 right-0 z-40 h-24 w-24"
        style={{ touchAction: 'none' }}
        aria-label="Grown-ups"
        role="button"
      >
        {progress > 0 && (
          <svg viewBox="0 0 48 48" className="absolute bottom-3 right-3 h-12 w-12 -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#00000018" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--cc-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
            />
          </svg>
        )}
      </div>

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
