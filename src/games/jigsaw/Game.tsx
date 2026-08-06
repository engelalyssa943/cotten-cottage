import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../../engine/types';
import { cutPicture, shuffled, type Cut, type Piece } from './cut';
import { PIC_H, PIC_W, Scene, SCENES, type SceneId } from './scenes';

/**
 * The jigsaw.
 *
 * Tap a piece to pick it up, tap a space to put it there. Not dragging: a
 * dragged piece can be dropped between two spaces, flung off an edge, or lost
 * by a hand that doesn't pinch reliably yet, and every one of those is a small
 * failure the child didn't earn. A tap always lands somewhere definite.
 *
 * Putting a piece in the wrong space is not a mistake either — the space gives
 * a shake, the piece stays in her hand, and she tries the next one. There is no
 * count of attempts anywhere on screen.
 *
 * Difficulty moves on its own and is never shown, the same as memory-pairs: a
 * puzzle solved with few wrong tries deals a bigger one next time, and one that
 * took a lot of hunting deals a smaller one. It is saved, so she carries on
 * from where she got to rather than restarting at six pieces every visit.
 */

interface Save {
  level: number;
}

/** Board shapes, easiest first. Only ever moves one step at a time. */
const LADDER: Array<[cols: number, rows: number]> = [
  [3, 2], // 6
  [4, 3], // 12
  [5, 3], // 15
  [6, 4], // 24
];

export default function JigsawGame({ band, theme, sound, save, award, reduceMotion }: GameProps) {
  const startLevel = band === 'star' ? 1 : 0;
  const [level, setLevel] = useState(startLevel);
  const [round, setRound] = useState(0);
  const [scene, setScene] = useState<SceneId>(() => SCENES[Math.floor(Math.random() * SCENES.length)]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [held, setHeld] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [box, setBox] = useState({ w: 900, h: 620 });

  const host = useRef<HTMLDivElement>(null);
  const wrong = useRef(0);
  const timers = useRef<number[]>([]);
  const melody = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const [cols, rows] = LADDER[Math.min(LADDER.length - 1, Math.max(0, level))];
  const cut: Cut = useMemo(() => cutPicture(PIC_W, PIC_H, cols, rows), [cols, rows, round]);
  const trayOrder = useMemo(() => shuffled(cut.pieces.map((p) => p.id)), [cut]);

  // Resume where she left off, rather than dropping back to six pieces.
  useEffect(() => {
    let live = true;
    void save.load<Save>().then((d) => {
      if (!live || typeof d?.level !== 'number') return;
      setLevel(Math.min(LADDER.length - 1, Math.max(0, d.level)));
    });
    return () => { live = false; };
  }, [save]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Board takes the top of the screen, the loose pieces the bottom.
  const trayH = Math.max(110, box.h * 0.26);
  const boardMaxH = box.h - trayH - 28;
  const boardW = Math.min(box.w - 32, boardMaxH * (PIC_W / PIC_H));
  const boardH = boardW * (PIC_H / PIC_W);
  const scale = boardW / PIC_W;
  const trayScale = Math.min(scale * 0.8, (trayH - 24) / (cut.cellH + cut.margin * 2));

  const remaining = trayOrder.filter((id) => !placed.has(id));

  const nextRound = useCallback((nextLevel: number) => {
    setLevel(nextLevel);
    setScene(SCENES[Math.floor(Math.random() * SCENES.length)]);
    setPlaced(new Set());
    setHeld(null);
    setDone(false);
    wrong.current = 0;
    setRound((r) => r + 1);
  }, []);

  function place(pieceId: string) {
    const next = new Set(placed).add(pieceId);
    setPlaced(next);
    setHeld(null);
    melody.current = (melody.current + 1) % 8;
    sound.pop(melody.current);

    if (next.size === cut.pieces.length) {
      setDone(true);
      award(`jigsaw:${scene}`);
      for (let i = 0; i < 5; i++) after(240 + i * 130, () => sound.chime(i + 2));

      // How much hunting it took decides the next one. Never shown, never named.
      const pieces = cut.pieces.length;
      let lvl = level;
      if (wrong.current <= pieces / 2) lvl = Math.min(LADDER.length - 1, level + 1);
      else if (wrong.current > pieces * 2) lvl = Math.max(0, level - 1);
      if (lvl !== level) void save.put<Save>({ level: lvl });
      after(2600, () => nextRound(lvl));
    }
  }

  function tapCell(pieceId: string) {
    if (done || !held || placed.has(pieceId)) return;
    if (held === pieceId) {
      place(pieceId);
      return;
    }
    // Not that space. It shakes its head; the piece stays in her hand.
    wrong.current += 1;
    setShaking(pieceId);
    sound.pop(0);
    after(420, () => setShaking(null));
  }

  const clipFor = (p: Piece) => `cc-jig-${round}-${p.id}`;

  /** One piece, with the whole picture drawn inside it and clipped to shape. */
  const PieceArt = ({ p, s }: { p: Piece; s: number }) => (
    <svg
      viewBox={`${p.bx} ${p.by} ${p.bw} ${p.bh}`}
      width={p.bw * s}
      height={p.bh * s}
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <clipPath id={clipFor(p)}>
          <path d={p.d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipFor(p)})`}>
        <Scene id={scene} />
      </g>
      <path d={p.d} fill="none" stroke="#00000030" strokeWidth={1.4} />
    </svg>
  );

  return (
    <div
      ref={host}
      className="relative h-full w-full overflow-hidden pl-[var(--cc-rail)]"
      style={{ background: `linear-gradient(180deg, ${theme.scale[100]}, ${theme.scale[300]})` }}
    >
      {/* the board */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-cozy"
        style={{
          top: 14,
          width: boardW,
          height: boardH,
          background: '#FFFFFF',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.12)',
          outline: `4px solid ${theme.scale[400]}`,
        }}
      >
        {/* the picture showing faintly through, so she can see where things go */}
        <svg
          viewBox={`0 0 ${PIC_W} ${PIC_H}`}
          width={boardW}
          height={boardH}
          className="absolute inset-0"
          style={{ opacity: band === 'star' ? 0.12 : 0.3 }}
          aria-hidden
        >
          <Scene id={scene} />
        </svg>

        {/* pieces already in, and a tap target for every empty space */}
        {cut.pieces.map((p) => {
          const isIn = placed.has(p.id);
          return (
            <div key={p.id} className="absolute" style={{ left: p.bx * scale, top: p.by * scale }}>
              {isIn ? (
                <PieceArt p={p} s={scale} />
              ) : (
                <button
                  onPointerDown={() => tapCell(p.id)}
                  aria-label={`space ${p.id}`}
                  className={shaking === p.id && !reduceMotion ? 'cc-shake' : ''}
                  style={{
                    position: 'absolute',
                    left: cut.margin * scale,
                    top: cut.margin * scale,
                    width: cut.cellW * scale,
                    height: cut.cellH * scale,
                    borderRadius: 6,
                    background: held ? 'rgba(255,255,255,0.25)' : 'transparent',
                    outline: held ? '2px dashed rgba(0,0,0,0.18)' : 'none',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* the loose pieces */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-3 overflow-x-auto px-4 pl-[calc(var(--cc-rail)+1rem)]"
        style={{ height: trayH }}
      >
        {remaining.map((id) => {
          const p = cut.pieces.find((x) => x.id === id)!;
          return (
            <button
              key={id}
              onPointerDown={() => { setHeld((h) => (h === id ? null : id)); sound.blip(2); }}
              aria-label={`piece ${id}`}
              className="shrink-0 transition-transform"
              style={{ transform: held === id ? 'scale(1.16)' : 'scale(1)' }}
            >
              <PieceArt p={p} s={trayScale} />
            </button>
          );
        })}
        {done && remaining.length === 0 && (
          <div className="grid h-full w-full place-items-center text-4xl" aria-hidden>
            🎉
          </div>
        )}
      </div>
    </div>
  );
}
