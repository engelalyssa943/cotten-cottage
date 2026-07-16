import { useEffect, useRef, useState } from 'react';
import type { SoundApi, ResolvedTheme } from '../../engine/types';
import { TopperSVG, TOPPERS } from './parts';
import { CakeView } from './CakeView';
import { BASES, FROSTINGS, PIPINGS, SPRINKLES, type Cake } from './types';

/**
 * The decorating surface. Base shape → frosting → piping → sprinkles → toppers.
 * Everything is draggable and removable, and nothing is ever wrong. Changes flow
 * up through onChange so the bakery can save them.
 */
export function Editor({
  cake,
  onChange,
  onBack,
  onDelete,
  sound,
  theme,
}: {
  cake: Cake;
  onChange: (c: Cake) => void;
  onBack: () => void;
  onDelete: () => void;
  sound: SoundApi;
  theme: ResolvedTheme;
}) {
  const cakeBox = useRef<HTMLDivElement>(null);
  const trash = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const cakeData = useRef(cake);
  const onChangeRef = useRef(onChange);
  cakeData.current = cake;
  onChangeRef.current = onChange;
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    const overlaps = (ref: React.RefObject<HTMLElement>, x: number, y: number) => {
      const r = ref.current?.getBoundingClientRect();
      return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    const move = (e: PointerEvent) => {
      const id = draggingId.current;
      if (!id) return;
      const box = cakeBox.current?.getBoundingClientRect();
      if (!box) return;
      if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) {
        const fx = (e.clientX - box.left) / box.width;
        const fy = (e.clientY - box.top) / box.height;
        onChangeRef.current({
          ...cakeData.current,
          toppers: cakeData.current.toppers.map((t) => (t.id === id ? { ...t, fx, fy } : t)),
        });
      }
    };
    const up = (e: PointerEvent) => {
      const id = draggingId.current;
      if (!id) return;
      draggingId.current = null;
      if (overlaps(trash, e.clientX, e.clientY)) {
        onChangeRef.current({
          ...cakeData.current,
          toppers: cakeData.current.toppers.filter((t) => t.id !== id),
        });
        sound.pop();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [sound]);

  const patch = (p: Partial<Cake>) => {
    onChange({ ...cake, ...p });
    sound.blip();
  };

  const addTopper = (kind: (typeof TOPPERS)[number]) => {
    onChange({
      ...cake,
      toppers: [
        ...cake.toppers,
        { id: crypto.randomUUID(), kind, fx: 0.42 + Math.random() * 0.16, fy: 0.2 + Math.random() * 0.14 },
      ],
    });
    sound.pop();
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-2">
      <div className="mb-1 text-xs font-medium text-ink/50">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

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

  return (
    <div className="flex h-screen w-screen flex-col bg-cream">
      {/* header: back + base shapes + delete */}
      <div className="flex items-center gap-3 px-4 py-2">
        <button onClick={onBack} className="grid h-12 w-12 place-items-center rounded-full bg-white shadow active:scale-95" aria-label="Back to shelf">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={theme.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex flex-1 flex-wrap gap-2">
          {BASES.map((b) => (
            <button
              key={b}
              onClick={() => patch({ base: b })}
              className={`h-12 w-12 rounded-cozy bg-white p-1 shadow-sm active:scale-95 ${cake.base === b ? 'ring-2 ring-accent' : ''}`}
              aria-label={`${b} cake`}
            >
              <CakeView cake={{ ...cake, base: b, toppers: [], sprinkles: null, piping: null }} />
            </button>
          ))}
        </div>
        {confirmDel ? (
          <span className="flex items-center gap-2 text-sm">
            <button onClick={onDelete} className="rounded-pill bg-red-400 px-3 py-1 text-white">Remove</button>
            <button onClick={() => setConfirmDel(false)} className="rounded-pill px-2 py-1 text-ink/60">Keep</button>
          </span>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="grid h-12 w-12 place-items-center rounded-full bg-white shadow active:scale-95" aria-label="Remove cake">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={theme.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* tools */}
        <div className="w-44 shrink-0 overflow-y-auto px-3 py-1">
          <Row label="Frosting">{FROSTINGS.map((c) => colorBtn(c, cake.frosting === c, () => patch({ frosting: c })))}</Row>
          <Row label="Piping">
            {noneBtn(cake.piping === null, () => patch({ piping: null }))}
            {PIPINGS.map((c) => colorBtn(c, cake.piping === c, () => patch({ piping: c })))}
          </Row>
          <Row label="Sprinkles">
            {noneBtn(cake.sprinkles === null, () => patch({ sprinkles: null }))}
            {colorBtn('rainbow', cake.sprinkles === 'rainbow', () => patch({ sprinkles: 'rainbow' }))}
            {SPRINKLES.map((c) => colorBtn(c, cake.sprinkles === c, () => patch({ sprinkles: c })))}
          </Row>
        </div>

        {/* cake */}
        <div className="relative flex-1">
          <div ref={cakeBox} className="absolute inset-0 m-auto aspect-square max-h-full max-w-full">
            <CakeView cake={cake} />
            {cake.toppers.map((t) => (
              <div
                key={t.id}
                onPointerDown={(e) => {
                  e.preventDefault();
                  draggingId.current = t.id;
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none active:cursor-grabbing"
                style={{ left: `${t.fx * 100}%`, top: `${t.fy * 100}%` }}
              >
                <TopperSVG kind={t.kind} size={46} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* topper tray + trash */}
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
