import { useEffect, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { CakeView } from './CakeView';
import { TopperSVG } from './parts';
import { Editor } from './Editor';
import { blankCake, type BakerySave, type Cake } from './types';

/** A static cake with its toppers — for the bakery shelf. */
function CakeThumb({ cake }: { cake: Cake }) {
  return (
    <div className="relative aspect-square w-full">
      <CakeView cake={cake} />
      {cake.toppers.map((t) => (
        <div key={t.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.fx * 100}%`, top: `${t.fy * 100}%` }}>
          <TopperSVG kind={t.kind} size={26} />
        </div>
      ))}
    </div>
  );
}

export default function CakeGame({ save, sound, theme }: GameProps) {
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
        onChange={(c) => commit({ cakes: bakery.cakes.map((x) => (x.id === c.id ? c : x)) })}
        onBack={() => setEditingId(null)}
        onDelete={() => {
          commit({ cakes: bakery.cakes.filter((x) => x.id !== editing.id) });
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-screen overflow-y-auto bg-cream p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-center text-xl font-medium text-ink/60">🧁 Bakery</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* new cake */}
          <button
            onClick={() => {
              const c = blankCake();
              commit({ cakes: [...bakery.cakes, c] });
              setEditingId(c.id);
            }}
            className="grid aspect-square place-items-center rounded-cozy border-4 border-dashed bg-white/50 active:scale-95"
            style={{ borderColor: theme.scale[300] }}
            aria-label="New cake"
          >
            <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke={theme.accent} strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          {bakery.cakes.map((c) => (
            <button
              key={c.id}
              onClick={() => setEditingId(c.id)}
              className="rounded-cozy bg-white p-2 shadow-sm active:scale-95"
              aria-label="Open cake"
            >
              <CakeThumb cake={c} />
            </button>
          ))}
        </div>
        {loaded && bakery.cakes.length === 0 && (
          <p className="mt-6 text-center text-ink/40">Tap + to bake a cake.</p>
        )}
      </div>
    </div>
  );
}
