import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { CreatureSVG, Scene } from './creature';
import { Dresser } from './Dresser';
import { blankLook, type Look, type WardrobeSave } from './types';

/** A finished look, hanging still on the rail. */
function LookThumb({ look, width = 132 }: { look: Look; width?: number }) {
  return (
    <div className="overflow-hidden rounded-cozy shadow-sm" style={{ width, height: (width * 360) / 300 }}>
      <div className="relative h-full w-full">
        <Scene kind={look.scene} />
        <CreatureSVG look={look} alive={false} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}

/** A stable little tilt per look, so the rail looks hung by hand. */
function tiltFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 100) / 100 - 0.5) * 5;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

function Hanger({ tilt }: { tilt: number }) {
  return (
    <svg viewBox="0 0 60 30" width="60" height="30" aria-hidden style={{ transform: `rotate(${tilt}deg)` }}>
      <path d="M30 6 q6 -6 0 -6 q-6 0 -3 5 l3 5" fill="none" stroke="#B08C63" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 10 L6 26 h48 Z" fill="none" stroke="#B08C63" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Rail() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="h-3 rounded-pill" style={{ background: 'linear-gradient(180deg,#D9B58A,#B08C63)' }} />
    </div>
  );
}

export default function DressUpGame({ save, sound, theme, reduceMotion, award }: GameProps) {
  const [wardrobe, setWardrobe] = useState<WardrobeSave>({ looks: [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(wardrobe);
  latest.current = wardrobe;

  useEffect(() => {
    void save.load<WardrobeSave>().then((d) => {
      if (d?.looks) setWardrobe({ looks: d.looks, unlocked: d.unlocked ?? [] });
      setLoaded(true);
    });
  }, [save]);

  function commit(next: WardrobeSave) {
    latest.current = next;
    setWardrobe(next);
    save.put(next);
  }

  /**
   * A look has hit one of the combinations. Anything already revealed is
   * ignored, so re-making an outfit is a quiet re-wearing, not a re-reward.
   */
  function discover(ids: string[]) {
    const owned = latest.current.unlocked ?? [];
    const fresh = ids.filter((id) => !owned.includes(id));
    if (!fresh.length) return;
    commit({ ...latest.current, unlocked: [...owned, ...fresh] });
    for (const id of fresh) award(id);
  }

  const editing = editingId ? wardrobe.looks.find((l) => l.id === editingId) ?? null : null;

  if (editing) {
    return (
      <Dresser
        look={editing}
        unlocked={wardrobe.unlocked ?? []}
        theme={theme}
        sound={sound}
        reduceMotion={reduceMotion}
        onChange={(l) => commit({ ...latest.current, looks: latest.current.looks.map((x) => (x.id === l.id ? l : x)) })}
        onBack={() => setEditingId(null)}
        onDiscover={discover}
        onDelete={() => {
          commit({ ...latest.current, looks: latest.current.looks.filter((x) => x.id !== editing.id) });
          setEditingId(null);
        }}
        onDuplicate={() => {
          const copy: Look = { ...editing, id: crypto.randomUUID() };
          commit({ ...latest.current, looks: [...latest.current.looks, copy] });
          setEditingId(copy.id);
        }}
      />
    );
  }

  type Slot = { kind: 'look'; look: Look } | { kind: 'new' };
  const slots: Slot[] = [...wardrobe.looks.map((look) => ({ kind: 'look' as const, look })), { kind: 'new' as const }];
  const rows = chunk(slots, 4);

  return (
    <div
      className="h-full w-full overflow-y-auto pr-6 pl-[calc(var(--cc-rail)+1.5rem)] pb-10 pt-5"
      style={{ background: 'linear-gradient(180deg,#FBF3E8 0%,#F3E6F0 100%)' }}
    >
      <h1 className="mb-4 text-center text-xl font-medium text-ink/55">👗 Wardrobe</h1>

      {rows.map((row, ri) => (
        <div key={ri} className="mb-8">
          <Rail />
          <div className="flex items-start justify-center gap-8 px-4">
            {row.map((slot, i) =>
              slot.kind === 'new' ? (
                <button
                  key="new"
                  onClick={() => {
                    const l = blankLook();
                    commit({ ...latest.current, looks: [...latest.current.looks, l] });
                    setEditingId(l.id);
                    sound.chime();
                  }}
                  className="mt-[30px] grid h-[158px] w-[132px] place-items-center rounded-cozy border-4 border-dashed bg-white/45 active:scale-95"
                  style={{ borderColor: theme.scale[300] }}
                  aria-label="New look"
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke={theme.accent} strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ) : (
                <button
                  key={slot.look.id}
                  onClick={() => {
                    setEditingId(slot.look.id);
                    sound.blip(i);
                  }}
                  className="flex origin-top flex-col items-center transition-transform active:scale-95"
                  aria-label="Open look"
                >
                  <Hanger tilt={tiltFor(slot.look.id)} />
                  <LookThumb look={slot.look} />
                </button>
              ),
            )}
          </div>
        </div>
      ))}

      {loaded && wardrobe.looks.length === 0 && (
        <p className="mt-2 text-center text-ink/40">Tap + to dress someone up.</p>
      )}
    </div>
  );
}
