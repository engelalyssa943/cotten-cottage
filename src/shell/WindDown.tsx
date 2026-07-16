import { useApp } from '../store/app';
import { useHold } from './useHold';

/**
 * Placeholder for the wind-down "see you soon" star field. The full experience
 * (gentle save, drift to the garden pond at dusk, music slowing) is wired in
 * Stage 4 alongside calm-pond. A hold-corner lets a grown-up leave it.
 */
export function WindDown() {
  const reset = useApp((s) => s.reset);
  const { progress, bind } = useHold(() => reset({ kind: 'profiles' }), 2000);

  return (
    <div className="relative grid h-screen w-screen place-items-center" style={{ background: '#20233F' }}>
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: i % 3 ? 2 : 3,
            height: i % 3 ? 2 : 3,
            opacity: 0.5,
          }}
        />
      ))}
      <div className="text-2xl text-white/80">see you soon ✨</div>
      <div {...bind} className="absolute bottom-0 right-0 h-24 w-24" style={{ touchAction: 'none' }} aria-label="Wake" role="button">
        {progress > 0 && (
          <div className="absolute bottom-6 right-6 h-6 w-6 rounded-full border-2 border-white/60" style={{ opacity: progress }} />
        )}
      </div>
    </div>
  );
}
