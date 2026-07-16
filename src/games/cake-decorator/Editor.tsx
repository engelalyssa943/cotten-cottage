import { useEffect, useRef, useState } from 'react';
import type { SoundApi, ResolvedTheme } from '../../engine/types';
import { TopperSVG, TOPPERS } from './parts';
import { CakeView } from './CakeView';
import { BASES, FROSTINGS, PIPINGS, SPRINKLES, type Cake } from './types';

/** Module scope on purpose: declared inside the component it would be a new
 *  component type every render, remounting its whole subtree each time. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-xs font-medium text-ink/50">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * The decorating surface. Base shape → frosting → piping → sprinkles → toppers,
 * plus a knife and a box of matches. Everything is draggable, removable and
 * reversible, and nothing is ever wrong.
 */
export function Editor({
  cake,
  onChange,
  onBack,
  onDelete,
  onDuplicate,
  sound,
  theme,
  reduceMotion,
}: {
  cake: Cake;
  onChange: (c: Cake) => void;
  onBack: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  sound: SoundApi;
  theme: ResolvedTheme;
  reduceMotion: boolean;
}) {
  const cakeBox = useRef<HTMLDivElement>(null);
  const trash = useRef<HTMLDivElement>(null);
  const cakeData = useRef(cake);
  const onChangeRef = useRef(onChange);
  cakeData.current = cake;
  onChangeRef.current = onChange;

  const down = useRef<{ id: string; t: number; x: number; y: number; moved: boolean } | null>(null);
  const melody = useRef({ step: 0, at: 0 });
  const [confirmDel, setConfirmDel] = useState(false);
  const [incoming, setIncoming] = useState<string | null>(null);

  /** Consecutive decorations walk up a pentatonic scale, then reset. */
  function note(): number {
    const now = performance.now();
    melody.current.step = now - melody.current.at > 1400 ? 0 : melody.current.step + 1;
    melody.current.at = now;
    return melody.current.step % 8;
  }

  useEffect(() => {
    const overlaps = (ref: React.RefObject<HTMLElement>, x: number, y: number) => {
      const r = ref.current?.getBoundingClientRect();
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const move = (e: PointerEvent) => {
      const d = down.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7) return; // still a tap
      d.moved = true;
      const box = cakeBox.current?.getBoundingClientRect();
      if (!box) return;
      if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) {
        const fx = (e.clientX - box.left) / box.width;
        const fy = (e.clientY - box.top) / box.height;
        onChangeRef.current({
          ...cakeData.current,
          toppers: cakeData.current.toppers.map((t) => (t.id === d.id ? { ...t, fx, fy } : t)),
        });
      }
    };
    const up = (e: PointerEvent) => {
      const d = down.current;
      if (!d) return;
      down.current = null;
      const c = cakeData.current;
      const topper = c.toppers.find((t) => t.id === d.id);

      if (!d.moved && performance.now() - d.t < 400) {
        // A tap, not a drag. Candles light and blow out; anything else just nudges.
        if (topper?.kind === 'candle') {
          const lit = !topper.lit;
          onChangeRef.current({
            ...c,
            toppers: c.toppers.map((t) => (t.id === d.id ? { ...t, lit } : t)),
          });
          if (lit) sound.chime(4);
          else sound.pop(0);
        }
        return;
      }
      if (overlaps(trash, e.clientX, e.clientY)) {
        onChangeRef.current({ ...c, toppers: c.toppers.filter((t) => t.id !== d.id) });
        sound.pop();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [sound]);

  const patch = (p: Partial<Cake>) => onChange({ ...cake, ...p });

  /** Restartable, so tapping again re-wobbles. */
  function wobble() {
    const el = cakeBox.current;
    if (!el) return;
    el.classList.remove('cc-wobble');
    void el.offsetWidth;
    el.classList.add('cc-wobble');
  }

  function setFrosting(c: string) {
    if (c === cake.frosting || incoming) return;
    sound.blip(2);
    if (reduceMotion) {
      patch({ frosting: c });
      return;
    }
    setIncoming(c);
  }

  // Safety net: the spread normally commits on animationend; if that never fires
  // the color must still land, or `incoming` blocks every future frosting change.
  useEffect(() => {
    if (!incoming) return;
    const t = window.setTimeout(() => {
      onChangeRef.current({ ...cakeData.current, frosting: incoming });
      setIncoming(null);
    }, 950);
    return () => window.clearTimeout(t);
  }, [incoming]);
  function setPiping(c: string | null) {
    patch({ piping: c });
    if (c) for (let i = 0; i < 10; i++) window.setTimeout(() => sound.blip(i), i * 45);
    else sound.pop(0);
  }
  function setSprinkles(c: string | null) {
    patch({ sprinkles: c });
    if (c) for (let i = 0; i < 6; i++) window.setTimeout(() => sound.pop(i + 2), i * 60);
    else sound.pop(0);
  }
  function addTopper(kind: (typeof TOPPERS)[number]) {
    onChange({
      ...cake,
      toppers: [
        ...cake.toppers,
        { id: crypto.randomUUID(), kind, fx: 0.42 + Math.random() * 0.16, fy: 0.2 + Math.random() * 0.14 },
      ],
    });
    sound.pop(note());
  }

  const colorBtn = (c: string, active: boolean, onClick: () => void) => (
    <button
      key={c}
      onClick={onClick}
      className={`h-8 w-8 rounded-full shadow-sm ${active ? 'ring-4 ring-ink/25' : ''}`}
      style={{ background: c === 'rainbow' ? 'conic-gradient(#EF7DA0,#F6C948,#8FD6C6,#A9C9F0,#EF7DA0)' : c }}
      aria-label="color"
    />
  );
  const noneBtn = (active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm ${active ? 'ring-4 ring-ink/25' : ''}`}
      aria-label="none"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="#c9b" strokeWidth="2"><path d="M5 5l14 14" /></svg>
    </button>
  );
  const iconBtn = (label: string, onClick: () => void, active: boolean, d: string) => (
    <button
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-full bg-white shadow active:scale-95 ${active ? 'ring-2 ring-accent' : ''}`}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={theme.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </button>
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-cream">
      <div className="flex items-center gap-2 px-4 py-2">
        {iconBtn('Back to shelf', onBack, false, 'M15 18l-6-6 6-6')}
        <div className="flex flex-1 flex-wrap gap-2">
          {BASES.map((b) => (
            <button
              key={b}
              onClick={() => { patch({ base: b }); sound.blip(); }}
              className={`h-12 w-12 rounded-cozy bg-white p-1 shadow-sm active:scale-95 ${cake.base === b ? 'ring-2 ring-accent' : ''}`}
              aria-label={`${b} cake`}
            >
              <CakeView cake={{ ...cake, base: b, toppers: [], sprinkles: null, piping: null, cut: false }} animate={false} />
            </button>
          ))}
        </div>
        {/* knife: take a slice out and see inside — always reversible */}
        {iconBtn(cake.cut ? 'Put the slice back' : 'Cut a slice', () => { patch({ cut: !cake.cut }); sound.pop(cake.cut ? 0 : 3); }, !!cake.cut, 'M14 3l7 7-9 9-3-3M5 21l4-4')}
        {iconBtn('Make another like this', () => { onDuplicate(); sound.chime(2); }, false, 'M9 9h10v10H9zM5 15V5h10')}
        {confirmDel ? (
          <span className="flex items-center gap-2 text-sm">
            <button onClick={onDelete} className="rounded-pill bg-red-400 px-3 py-1 text-white">Remove</button>
            <button onClick={() => setConfirmDel(false)} className="rounded-pill px-2 py-1 text-ink/60">Keep</button>
          </span>
        ) : (
          iconBtn('Remove cake', () => setConfirmDel(true), false, 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13')
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-44 shrink-0 overflow-y-auto px-3 py-1">
          <Row label="Frosting">{FROSTINGS.map((c) => colorBtn(c, (incoming ?? cake.frosting) === c, () => setFrosting(c)))}</Row>
          <Row label="Piping">
            {noneBtn(cake.piping === null, () => setPiping(null))}
            {PIPINGS.map((c) => colorBtn(c, cake.piping === c, () => setPiping(c)))}
          </Row>
          <Row label="Sprinkles">
            {noneBtn(cake.sprinkles === null, () => setSprinkles(null))}
            {colorBtn('rainbow', cake.sprinkles === 'rainbow', () => setSprinkles('rainbow'))}
            {SPRINKLES.map((c) => colorBtn(c, cake.sprinkles === c, () => setSprinkles(c)))}
          </Row>
        </div>

        <div className="relative flex-1">
          <div
            ref={cakeBox}
            onPointerDown={() => { wobble(); sound.pop(1); }}
            className="absolute inset-0 m-auto aspect-square max-h-full max-w-full"
          >
            <CakeView cake={cake} />
            {/* the new frosting spreads out over the old */}
            {incoming && (
              <div
                className="cc-frost absolute inset-0"
                onAnimationEnd={() => {
                  onChangeRef.current({ ...cakeData.current, frosting: incoming });
                  setIncoming(null);
                }}
              >
                <CakeView cake={{ ...cake, frosting: incoming }} animate={false} />
              </div>
            )}
            {cake.toppers.map((t) => (
              <div
                key={t.id}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  down.current = { id: t.id, t: performance.now(), x: e.clientX, y: e.clientY, moved: false };
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
                style={{ left: `${t.fx * 100}%`, top: `${t.fy * 100}%` }}
              >
                <TopperSVG kind={t.kind} size={46} lit={t.lit} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        <div className="flex flex-1 flex-wrap gap-2">
          {TOPPERS.map((k) => (
            <button
              key={k}
              onClick={() => addTopper(k)}
              className="grid h-[68px] w-[68px] place-items-center rounded-cozy bg-white/80 shadow-sm active:scale-95"
              aria-label={k}
            >
              <TopperSVG kind={k} size={48} />
            </button>
          ))}
        </div>
        <div ref={trash} className="grid h-[68px] w-[68px] place-items-center rounded-cozy border-2 border-dashed" style={{ borderColor: theme.scale[400] }} aria-label="Remove topper">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke={theme.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
        </div>
      </div>
    </div>
  );
}
