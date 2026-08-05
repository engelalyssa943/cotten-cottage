import { useEffect, useRef, useState } from 'react';
import type { ResolvedTheme, SoundApi } from '../../engine/types';
import { CreatureSVG, Scene } from './creature';
import { ItemThumb } from './items';
import { discoveriesFor, UNLOCKS } from './collectibles';
import {
  BASE_ITEMS,
  BODY_COLORS,
  MANE_COLORS,
  SCENES,
  SLOTS,
  SLOT_PALETTE,
  nextColor,
  type Look,
  type SceneKind,
  type Slot,
} from './types';

/** Module scope on purpose — declared inline it would remount every render. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-medium text-ink/50">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

const SLOT_ICON: Record<Slot, string> = {
  head: 'M4 17 L6 8 L10 12 L12 6 L14 12 L18 8 L20 17 Z',
  outfit: 'M9 4 L15 4 L17 8 L15 9 L17 20 L7 20 L9 9 L7 8 Z',
  shoes: 'M5 9 H10 L12 13 H17 A3 3 0 0 1 20 16 V19 H5 Z',
  wings: 'M12 6 C 8 6 3 9 3 15 C 8 15 11 12 12 9 C 13 12 16 15 21 15 C 21 9 16 6 12 6 Z',
  face: 'M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M8 10 h.01 M16 10 h.01 M8 15 q4 4 8 0',
};

const SCENE_SWATCH: Record<SceneKind, string> = {
  meadow: 'linear-gradient(180deg,#CFEBFF,#96D086)',
  clouds: 'linear-gradient(180deg,#FFE0EE,#FFF6E6)',
  night: 'linear-gradient(180deg,#2E2A5E,#5B4A86)',
  castle: 'linear-gradient(180deg,#FFD3B6,#C79BE6)',
};

/**
 * The dressing room. Tap a piece in the tray to put it on, tap it again to take
 * it off, tap a piece she's wearing to walk its colour around. Nothing is ever
 * wrong, nothing can be dropped or lost, and there is no finished outfit.
 */
export function Dresser({
  look,
  unlocked,
  onChange,
  onBack,
  onDelete,
  onDuplicate,
  onDiscover,
  sound,
  theme,
  reduceMotion,
}: {
  look: Look;
  unlocked: string[];
  onChange: (l: Look) => void;
  onBack: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDiscover: (ids: string[]) => void;
  sound: SoundApi;
  theme: ResolvedTheme;
  reduceMotion: boolean;
}) {
  const [slot, setSlot] = useState<Slot>('head');
  const [confirmDel, setConfirmDel] = useState(false);
  const figure = useRef<HTMLDivElement>(null);
  const melody = useRef({ step: 0, at: 0 });
  const onDiscoverRef = useRef(onDiscover);
  onDiscoverRef.current = onDiscover;

  /** Consecutive dressing walks up a pentatonic scale, then resets. */
  function note(): number {
    const now = performance.now();
    melody.current.step = now - melody.current.at > 1400 ? 0 : melody.current.step + 1;
    melody.current.at = now;
    return melody.current.step % 8;
  }

  // Every change re-checks the combinations. The parent decides what is new.
  useEffect(() => {
    const found = discoveriesFor(look);
    if (found.length) onDiscoverRef.current(found);
  }, [look]);

  /** Restartable, so tapping her again re-plays it. Only ever one at a time. */
  function play(cls: string) {
    const el = figure.current;
    if (!el || reduceMotion) return;
    el.classList.remove('cc-du-twirl', 'cc-du-bounce');
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function wear(kind: string) {
    const current = look[slot];
    if (current?.kind === kind) {
      onChange({ ...look, [slot]: null });
      sound.pop(0);
      return;
    }
    onChange({ ...look, [slot]: { kind, color: SLOT_PALETTE[slot][0] } });
    sound.pop(note());
    play('cc-du-bounce');
  }

  function cycle(s: Slot) {
    const current = look[s];
    if (!current) return;
    onChange({ ...look, [s]: { ...current, color: nextColor(s, current.color) } });
    sound.blip(note());
  }

  const bodySwatches = [theme.scale[100], theme.scale[200], ...BODY_COLORS];
  const maneSwatches = [theme.favorite, theme.accent, ...MANE_COLORS];
  // Base pieces first, then anything a discovery has revealed for this slot.
  const items = [...BASE_ITEMS[slot]];
  for (const id of unlocked) {
    const u = UNLOCKS[id];
    if (u && u.slot === slot) items.push(u.kind);
  }

  const colorBtn = (c: string, active: boolean, onClick: () => void, key: string) => (
    <button
      key={key}
      onClick={onClick}
      className={`h-9 w-9 rounded-full shadow-sm ${active ? 'ring-4 ring-ink/25' : ''}`}
      style={{ background: c }}
      aria-label="color"
    />
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
    <div className="flex h-full w-full flex-col bg-cream pl-[var(--cc-rail)]">
      <div className="flex items-center gap-2 px-4 py-2">
        {iconBtn('Back to the wardrobe', onBack, false, 'M15 18l-6-6 6-6')}
        <div className="flex flex-1 flex-wrap gap-2">
          {SCENES.map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange({ ...look, scene: s });
                sound.chime(SCENES.indexOf(s));
              }}
              className={`h-12 w-16 rounded-cozy shadow-sm active:scale-95 ${look.scene === s ? 'ring-2 ring-accent' : ''}`}
              style={{ background: SCENE_SWATCH[s] }}
              aria-label={s}
            />
          ))}
        </div>
        {iconBtn('Make another like this', () => { onDuplicate(); sound.chime(2); }, false, 'M9 9h10v10H9zM5 15V5h10')}
        {confirmDel ? (
          <span className="flex items-center gap-2 text-sm">
            <button onClick={onDelete} className="rounded-pill bg-red-400 px-3 py-1 text-white">Remove</button>
            <button onClick={() => setConfirmDel(false)} className="rounded-pill px-2 py-1 text-ink/60">Keep</button>
          </span>
        ) : (
          iconBtn('Remove this look', () => setConfirmDel(true), false, 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13')
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-40 shrink-0 overflow-y-auto px-3 py-1">
          <Row label="Her colour">
            {bodySwatches.map((c, i) => colorBtn(c, look.body === c, () => { onChange({ ...look, body: c }); sound.blip(i % 8); }, `b${i}`))}
          </Row>
          <Row label="Mane">
            {maneSwatches.map((c, i) => colorBtn(c, look.mane === c, () => { onChange({ ...look, mane: c }); sound.blip(i % 8); }, `m${i}`))}
          </Row>
        </div>

        <div className="relative min-w-0 flex-1 p-2">
          <div className="absolute inset-2 m-auto aspect-[300/360] max-h-full max-w-full overflow-hidden rounded-cozy shadow-inner">
            <Scene kind={look.scene} />
            {/* the twirl belongs to her, not to the world behind her */}
            <div ref={figure} className="absolute inset-0">
              <CreatureSVG
                look={look}
                alive={!reduceMotion}
                onTapItem={cycle}
                onTapBody={() => { play('cc-du-twirl'); sound.chime(note()); }}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex w-20 shrink-0 flex-col items-center gap-2 overflow-y-auto py-1">
          {SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => { setSlot(s); sound.blip(SLOTS.indexOf(s)); }}
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-cozy bg-white shadow active:scale-95 ${slot === s ? 'ring-2 ring-accent' : ''}`}
              aria-label={s}
            >
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke={look[s] ? theme.accent : theme.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d={SLOT_ICON[s]} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        {items.map((kind) => {
          const active = look[slot]?.kind === kind;
          return (
            <button
              key={kind}
              onClick={() => wear(kind)}
              className={`grid h-[72px] w-[72px] shrink-0 place-items-center rounded-cozy bg-white/85 shadow-sm active:scale-95 ${active ? 'ring-2 ring-accent' : ''}`}
              aria-label={kind}
            >
              <ItemThumb slot={slot} kind={kind} color={active ? look[slot]!.color : SLOT_PALETTE[slot][0]} size={54} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
