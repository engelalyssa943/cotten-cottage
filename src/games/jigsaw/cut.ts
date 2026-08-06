/**
 * Cutting a picture into jigsaw pieces.
 *
 * Every internal edge gets a knob pointing one way or the other, and the two
 * pieces either side of it share that one decision — so the bump on one is
 * exactly the hollow in its neighbour.
 *
 * The subtlety: two pieces sharing an edge must draw the IDENTICAL curve in
 * absolute coordinates, just walked in opposite directions. Walking each
 * outline clockwise means the right edge is travelled top-to-bottom while the
 * neighbour walks the same line bottom-to-top, which flips the perpendicular —
 * so the reversed side has to negate the stored direction to land on the same
 * curve. Without that negation both pieces dent inward and leave a hole
 * between them, which is exactly what the first version of this did.
 *
 * `dir` is stored as "which way the curve bulges" in absolute terms: +x for
 * vertical edges, +y for horizontal ones.
 *
 * Pure geometry — no React, no DOM.
 */

export interface Piece {
  id: string;
  col: number;
  row: number;
  /** Outline in picture coordinates. */
  d: string;
  /** Bounding box including the knobs that stick out past the cell. */
  bx: number;
  by: number;
  bw: number;
  bh: number;
}

export interface Cut {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  /** How far a knob reaches past the cell edge. */
  margin: number;
  pieces: Piece[];
}

/**
 * A knob, described in edge-local terms: `t` runs 0..1 along the edge and `o`
 * is the sideways offset. Backward-leaning control points (0.24, 0.76) are what
 * give it a narrow neck instead of a plain bump.
 */
const KNOB: Array<[t: number, o: number]> = [
  [0.36, 0],
  [0.30, 0.36], [0.24, 0.86], [0.5, 0.96],
  [0.76, 0.86], [0.70, 0.36], [0.64, 0],
];

function edge(
  x0: number, y0: number,
  x1: number, y1: number,
  dir: 0 | 1 | -1,
  knob: number,
): string {
  if (dir === 0) return `L ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular to the direction of travel — this is what makes neighbours fit.
  const px = -uy;
  const py = ux;
  const at = (t: number, o: number) => {
    const k = o * knob * dir;
    return `${(x0 + ux * len * t + px * k).toFixed(2)} ${(y0 + uy * len * t + py * k).toFixed(2)}`;
  };
  const [n0, c1, c2, mid, c3, c4, n1] = KNOB;
  return (
    `L ${at(n0[0], n0[1])} ` +
    `C ${at(c1[0], c1[1])} ${at(c2[0], c2[1])} ${at(mid[0], mid[1])} ` +
    `C ${at(c3[0], c3[1])} ${at(c4[0], c4[1])} ${at(n1[0], n1[1])} ` +
    `L ${x1.toFixed(2)} ${y1.toFixed(2)}`
  );
}

export function cutPicture(w: number, h: number, cols: number, rows: number): Cut {
  const cellW = w / cols;
  const cellH = h / rows;
  const knob = Math.min(cellW, cellH) * 0.22;

  // One decision per internal edge, shared by both neighbours.
  const vert: number[][] = []; // vert[row][col] = edge between col-1 and col
  const horiz: number[][] = []; // horiz[row][col] = edge between row-1 and row
  for (let r = 0; r < rows; r++) {
    vert[r] = [];
    horiz[r] = [];
    for (let c = 0; c <= cols; c++) {
      vert[r][c] = Math.random() < 0.5 ? -1 : 1;
      horiz[r][c] = Math.random() < 0.5 ? -1 : 1;
    }
  }

  const pieces: Piece[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;
      // Right and bottom are walked against the stored direction, so they are
      // negated to trace the same curve their neighbour will trace.
      const top = (r === 0 ? 0 : horiz[r][c]) as 0 | 1 | -1;
      const right = (c === cols - 1 ? 0 : -vert[r][c + 1]) as 0 | 1 | -1;
      const bottom = (r === rows - 1 ? 0 : -horiz[r + 1][c]) as 0 | 1 | -1;
      const left = (c === 0 ? 0 : vert[r][c]) as 0 | 1 | -1;

      const d =
        `M ${x.toFixed(2)} ${y.toFixed(2)} ` +
        edge(x, y, x + cellW, y, top, knob) + ' ' +
        edge(x + cellW, y, x + cellW, y + cellH, right, knob) + ' ' +
        edge(x + cellW, y + cellH, x, y + cellH, bottom, knob) + ' ' +
        edge(x, y + cellH, x, y, left, knob) + ' Z';

      pieces.push({
        id: `${c}-${r}`,
        col: c,
        row: r,
        d,
        bx: x - knob,
        by: y - knob,
        bw: cellW + knob * 2,
        bh: cellH + knob * 2,
      });
    }
  }

  return { cols, rows, cellW, cellH, margin: knob, pieces };
}

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
