import { useEffect, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { CakeView } from './CakeView';
import { TopperSVG } from './parts';
import { Editor } from './Editor';
import { blankCake, type BakerySave, type Cake } from './types';

/** A static cake with its toppers — what sits on the shelf. */
function CakeThumb({ cake, size = 150 }: { cake: Cake; size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <CakeView cake={cake} animate={false} />
      {cake.toppers.map((t) => (
        <div
          key={t.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${t.fx * 100}%`, top: `${t.fy * 100}%` }}
        >
          <TopperSVG kind={t.kind} size={size * 0.17} lit={t.lit} />
        </div>
      ))}
    </div>
  );
}

/** A stable little tilt per cake, so the shelf looks arranged by hand. */
function tiltFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 100) / 100 - 0.5) * 6;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

function Plank() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="h-3.5 rounded-t-sm" style={{ background: 'linear-gradient(180deg,#D2A26A,#B98455)' }} />
      <div className="h-2.5 rounded-b" style={{ background: '#8E6238', boxShadow: '0 8px 12px #0000001f' }} />
    </div>
  );
}

export default function CakeGame({ save, sound, theme, reduceMotion }: GameProps) {
  const [bakery, setBakery] = useState<BakerySave>({ cakes: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void save.load<BakerySave>().then((d) => {
      if (d?.cakes) setBakery(d);
      setLoaded(true);
    });
  }, [save]);

  function commit(next: BakerySave) {
    setBakery(next);
    save.put(next);
  }

  const editing = editingId ? bakery.cakes.find((c) => c.id === editingId) ?? null : null;

  if (editing) {
    return (
      <Editor
        cake={editing}
        theme={theme}
        sound={sound}
        reduceMotion={reduceMotion}
        onChange={(c) => commit({ cakes: bakery.cakes.map((x) => (x.id === c.id ? c : x)) })}
        onBack={() => setEditingId(null)}
        onDelete={() => {
          commit({ cakes: bakery.cakes.filter((x) => x.id !== editing.id) });
          setEditingId(null);
        }}
        onDuplicate={() => {
          const copy: Cake = {
            ...editing,
            id: crypto.randomUUID(),
            toppers: editing.toppers.map((t) => ({ ...t, id: crypto.randomUUID() })),
          };
          commit({ cakes: [...bakery.cakes, copy] });
          setEditingId(copy.id);
        }}
      />
    );
  }

  type Slot = { kind: 'cake'; cake: Cake } | { kind: 'new' };
  const slots: Slot[] = [...bakery.cakes.map((cake) => ({ kind: 'cake' as const, cake })), { kind: 'new' as const }];
  const rows = chunk(slots, 4);

  return (
    <div
      className="min-h-screen w-screen overflow-y-auto px-6 pb-10 pt-5"
      style={{ background: 'linear-gradient(180deg,#FBF3E8 0%,#F4E7D6 100%)' }}
    >
      <h1 className="mb-5 text-center text-xl font-medium text-ink/55">🧁 Bakery</h1>

      {rows.map((row, ri) => (
        <div key={ri} className="mb-9">
          <div className="flex items-end justify-center gap-8 px-4">
            {row.map((slot, i) =>
              slot.kind === 'new' ? (
                <button
                  key="new"
                  onClick={() => {
                    const c = blankCake();
                    commit({ cakes: [...bakery.cakes, c] });
                    setEditingId(c.id);
                    sound.chime();
                  }}
                  className="grid h-[128px] w-[128px] place-items-center rounded-cozy border-4 border-dashed bg-white/45 active:scale-95"
                  style={{ borderColor: theme.scale[300] }}
                  aria-label="New cake"
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke={theme.accent} strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ) : (
                <button
                  key={slot.cake.id}
                  onClick={() => {
                    setEditingId(slot.cake.id);
                    sound.blip(i);
                  }}
                  className="origin-bottom transition-transform active:scale-95"
                  style={{ transform: `rotate(${tiltFor(slot.cake.id)}deg)` }}
                  aria-label="Open cake"
                >
                  <CakeThumb cake={slot.cake} />
                </button>
              ),
            )}
          </div>
          <Plank />
        </div>
      ))}

      {loaded && bakery.cakes.length === 0 && (
        <p className="mt-2 text-center text-ink/40">Tap + to bake a cake.</p>
      )}
    </div>
  );
}
