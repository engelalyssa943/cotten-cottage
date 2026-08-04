import type { AgeBand } from '../../engine/types';

/**
 * The pond: a still surface that answers every touch and asks for nothing.
 *
 * There is no goal here, nothing to reach, nothing that can be missed. A finger
 * makes rings, the rings meet each other and brighten where they cross, the
 * lilies rock as the fronts pass under them, and the koi go on being koi. It is
 * the one game every band opens, so it has to work for a one-year-old palm and
 * a five-year-old fingertip alike — which it does by having no targets at all.
 *
 * Pure simulation and drawing: no React, no DOM, no timers.
 */

export interface Ripple {
  x: number;
  y: number;
  born: number;
  /** Scales radius, thickness and brightness together. */
  strength: number;
}

export interface Pad {
  x: number;
  y: number;
  r: number;
  rot: number;
  /** Radians/sec of lazy spin. */
  spin: number;
  driftX: number;
  driftY: number;
  flower: boolean;
  /** Current displacement from passing ripple fronts, springing back to zero. */
  ox: number;
  oy: number;
  tilt: number;
}

export interface Koi {
  x: number;
  y: number;
  ang: number;
  speed: number;
  size: number;
  phase: number;
  /** 0 = orange, 1 = white-and-red, 2 = themed. */
  tone: 0 | 1 | 2;
}

export interface Pond {
  w: number;
  h: number;
  ripples: Ripple[];
  pads: Pad[];
  koi: Koi[];
  /** Bigger everything for the smallest hands. */
  scale: number;
  /**
   * Every size below is a fraction of this, never a pixel count, so the pond
   * looks like the same pond on a phone-sized window and a full tablet.
   */
  unit: number;
}

export interface Palette {
  shallow: string;
  mid: string;
  deep: string;
  ring: string;
  flower: string;
  flowerHeart: string;
  themedKoi: string;
  /** The child's colour, carried by the light on the water. */
  sheen: string;
}

const RIPPLE_LIFE = 2.8; // seconds
const RIPPLE_SPEED = 0.21; // units/sec at strength 1
const FRONT_REACH = 0.065; // how far either side of a front a lily feels it
const PAD_MIN = 0.05;
const PAD_MAX = 0.078;
const KOI_MIN = 0.05;
const KOI_MAX = 0.068;

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => {
    const va = (pa >> sh) & 255;
    const vb = (pb >> sh) & 255;
    return Math.round(va + (vb - va) * t);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Water first, the child's colour second — a pond has to read as water.
 *
 * Her colour is deliberately NOT mixed into the water itself: pink stirred into
 * a green-teal in RGB lands on grey, and a grey pond is nobody's pond. It rides
 * on the light instead, and on the lilies and one of the koi, which reads as
 * hers without muddying anything.
 */
export function palette(favorite: string, accent: string): Palette {
  return {
    shallow: mixHex('#CDEFE0', favorite, 0.1),
    mid: mixHex('#77C6BE', favorite, 0.08),
    deep: mixHex('#2F8395', favorite, 0.06),
    ring: '#FFFFFF',
    flower: mixHex('#FFFFFF', favorite, 0.75),
    flowerHeart: '#FBE3A2',
    themedKoi: mixHex('#FFFFFF', accent, 0.72),
    sheen: favorite,
  };
}

export function createPond(w: number, h: number, band: AgeBand): Pond {
  const scale = band === 'sprout' ? 1.35 : band === 'bud' ? 1.15 : 1;
  const unit = Math.min(w, h);
  const pads: Pad[] = [];
  for (let i = 0; i < 5; i++) {
    pads.push({
      x: rand(w * 0.12, w * 0.88),
      y: rand(h * 0.12, h * 0.88),
      r: rand(PAD_MIN, PAD_MAX) * unit * scale,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.05, 0.05),
      driftX: rand(-0.004, 0.004) * unit,
      driftY: rand(-0.003, 0.003) * unit,
      flower: i % 2 === 0,
      ox: 0,
      oy: 0,
      tilt: 0,
    });
  }

  const koi: Koi[] = [];
  for (let i = 0; i < 3; i++) {
    koi.push({
      x: rand(w * 0.2, w * 0.8),
      y: rand(h * 0.2, h * 0.8),
      ang: rand(0, Math.PI * 2),
      speed: rand(0.026, 0.04) * unit,
      size: rand(KOI_MIN, KOI_MAX) * unit * scale,
      phase: rand(0, Math.PI * 2),
      tone: i as 0 | 1 | 2,
    });
  }

  return { w, h, ripples: [], pads, koi, scale, unit };
}

/** Keep the furniture inside a pond that just changed shape, at the same relative size. */
export function resizePond(p: Pond, w: number, h: number): void {
  const sx = p.w > 0 ? w / p.w : 1;
  const sy = p.h > 0 ? h / p.h : 1;
  const unit = Math.min(w, h);
  const su = p.unit > 0 ? unit / p.unit : 1;
  for (const pad of p.pads) {
    pad.x *= sx;
    pad.y *= sy;
    pad.r *= su;
    pad.driftX *= su;
    pad.driftY *= su;
  }
  for (const k of p.koi) {
    k.x *= sx;
    k.y *= sy;
    k.size *= su;
    k.speed *= su;
  }
  p.w = w;
  p.h = h;
  p.unit = unit;
}

export function addRipple(p: Pond, x: number, y: number, now: number, strength = 1): void {
  p.ripples.push({ x, y, born: now, strength: strength * p.scale });
  // A hard ceiling so a palm mashed on the glass can never starve the frame.
  if (p.ripples.length > 60) p.ripples.splice(0, p.ripples.length - 60);
}

function ringRadius(p: Pond, r: Ripple, now: number, reduceMotion: boolean): number {
  const age = now - r.born;
  // a still glow, not a spreading front
  if (reduceMotion) return 0.06 * p.unit * r.strength;
  return age * RIPPLE_SPEED * p.unit * r.strength;
}

function ringLife(reduceMotion: boolean): number {
  return reduceMotion ? 1.6 : RIPPLE_LIFE;
}

export function step(p: Pond, now: number, dt: number, reduceMotion: boolean): void {
  const life = ringLife(reduceMotion);
  p.ripples = p.ripples.filter((r) => now - r.born < life);

  // --- lilies: drift, spin, and rock as a front passes underneath ---
  const springBack = Math.pow(0.015, dt);
  for (const pad of p.pads) {
    pad.x += pad.driftX * dt;
    pad.y += pad.driftY * dt;
    if (pad.x < pad.r) { pad.x = pad.r; pad.driftX = Math.abs(pad.driftX); }
    if (pad.x > p.w - pad.r) { pad.x = p.w - pad.r; pad.driftX = -Math.abs(pad.driftX); }
    if (pad.y < pad.r) { pad.y = pad.r; pad.driftY = Math.abs(pad.driftY); }
    if (pad.y > p.h - pad.r) { pad.y = p.h - pad.r; pad.driftY = -Math.abs(pad.driftY); }
    pad.rot += pad.spin * dt;

    pad.ox *= springBack;
    pad.oy *= springBack;
    pad.tilt *= springBack;

    if (reduceMotion) continue;
    const reach = FRONT_REACH * p.unit;
    for (const r of p.ripples) {
      const dx = pad.x - r.x;
      const dy = pad.y - r.y;
      const d = Math.hypot(dx, dy) || 1;
      const front = ringRadius(p, r, now, false);
      const off = Math.abs(d - front);
      if (off > reach) continue;
      const age = (now - r.born) / life;
      const push = (1 - off / reach) * (1 - age) * 0.032 * p.unit * dt * r.strength;
      pad.ox += (dx / d) * push;
      pad.oy += (dy / d) * push;
      pad.tilt += (push / p.unit) * 9;
    }
  }

  // --- koi: wander slowly, drift toward whatever just touched the water ---
  const speedScale = reduceMotion ? 0.35 : 1;
  for (const k of p.koi) {
    k.ang += Math.sin(now * 0.27 + k.phase) * 0.55 * dt;

    const notice = 0.38 * p.unit;
    let nearest: Ripple | null = null;
    let nd = notice;
    for (const r of p.ripples) {
      const d = Math.hypot(k.x - r.x, k.y - r.y);
      if (d < nd) { nd = d; nearest = r; }
    }
    if (nearest) {
      const want = Math.atan2(nearest.y - k.y, nearest.x - k.x);
      let diff = want - k.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      k.ang += diff * 0.5 * dt * (1 - nd / notice);
    }

    // turn away from the bank rather than bumping into it
    const m = 0.09 * p.unit;
    if (k.x < m || k.x > p.w - m || k.y < m || k.y > p.h - m) {
      const want = Math.atan2(p.h / 2 - k.y, p.w / 2 - k.x);
      let diff = want - k.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      k.ang += diff * 1.6 * dt;
    }

    const v = k.speed * speedScale;
    k.x += Math.cos(k.ang) * v * dt;
    k.y += Math.sin(k.ang) * v * dt;
    k.x = Math.max(8, Math.min(p.w - 8, k.x));
    k.y = Math.max(8, Math.min(p.h - 8, k.y));
  }
}

// ---------------------------------------------------------------- drawing ---

function drawWater(
  ctx: CanvasRenderingContext2D,
  p: Pond,
  now: number,
  pal: Palette,
  reduceMotion: boolean,
) {
  const g = ctx.createLinearGradient(0, 0, 0, p.h);
  g.addColorStop(0, pal.shallow);
  g.addColorStop(0.55, pal.mid);
  g.addColorStop(1, pal.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, p.w, p.h);

  // Soft patches of light wandering over the surface. Radial gradients rather
  // than filled outlines, so there is never a hard edge in the water.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const drift = reduceMotion ? 0 : now * 0.06;
  for (let i = 0; i < 4; i++) {
    const cx = p.w * (0.2 + 0.2 * i) + Math.sin(drift + i * 1.7) * p.w * 0.1;
    const cy = p.h * (0.24 + 0.17 * i) + Math.cos(drift * 0.8 + i * 2.3) * p.h * 0.07;
    const rad = p.unit * (0.3 + 0.06 * i);
    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    // alternating plain light and light in the child's colour
    g2.addColorStop(0, i % 2 ? rgba(pal.sheen, 0.12) : 'rgba(255,255,255,0.08)');
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  ctx.restore();

  // the water darkens toward the bank
  const vig = ctx.createRadialGradient(p.w / 2, p.h / 2, p.unit * 0.25, p.w / 2, p.h / 2, p.unit * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,50,60,0.18)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, p.w, p.h);
}

function drawKoi(ctx: CanvasRenderingContext2D, k: Koi, now: number, pal: Palette, reduceMotion: boolean) {
  const wag = reduceMotion ? 0 : Math.sin(now * 3.4 + k.phase) * 0.34;
  const body = k.tone === 0 ? '#F0913F' : k.tone === 1 ? '#FBF7F2' : pal.themedKoi;
  const mark = k.tone === 0 ? '#FFD9A6' : k.tone === 1 ? '#EE7B7B' : '#FFFFFF';

  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.ang);
  const L = k.size;
  const W = k.size * 0.42;

  // tail
  ctx.save();
  ctx.rotate(wag);
  ctx.fillStyle = body;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-L * 0.42, 0);
  ctx.quadraticCurveTo(-L * 0.78, -W * 0.7, -L * 0.95, 0);
  ctx.quadraticCurveTo(-L * 0.78, W * 0.7, -L * 0.42, 0);
  ctx.fill();
  ctx.restore();

  // body
  ctx.globalAlpha = 1;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(L * 0.5, 0);
  ctx.quadraticCurveTo(L * 0.1, -W, -L * 0.42, 0);
  ctx.quadraticCurveTo(L * 0.1, W, L * 0.5, 0);
  ctx.fill();

  // side fins
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, -W * 0.55, L * 0.16, W * 0.3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, W * 0.55, L * 0.16, W * 0.3, 0.5, 0, Math.PI * 2);
  ctx.fill();

  // markings
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = mark;
  ctx.beginPath();
  ctx.ellipse(L * 0.16, -W * 0.12, L * 0.13, W * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-L * 0.16, W * 0.1, L * 0.1, W * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPad(ctx: CanvasRenderingContext2D, pad: Pad, pal: Palette) {
  const x = pad.x + pad.ox;
  const y = pad.y + pad.oy;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(pad.rot);
  ctx.scale(1, 1 - Math.min(0.16, Math.abs(pad.tilt)));

  // shadow in the water
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#0A3B45';
  ctx.beginPath();
  ctx.ellipse(pad.r * 0.08, pad.r * 0.11, pad.r, pad.r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#63B267';
  ctx.beginPath();
  ctx.arc(0, 0, pad.r, 0.34, Math.PI * 2 - 0.34);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#4C9455';
  ctx.lineWidth = Math.max(1, pad.r * 0.045);
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 5; i++) {
    const a = -1.0 + i * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * pad.r * 0.88, Math.sin(a) * pad.r * 0.88);
    ctx.stroke();
  }

  if (pad.flower) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.flower;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * pad.r * 0.2, Math.sin(a) * pad.r * 0.2, pad.r * 0.26, pad.r * 0.13, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = pal.flowerHeart;
    ctx.beginPath();
    ctx.arc(0, 0, pad.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function draw(
  ctx: CanvasRenderingContext2D,
  p: Pond,
  now: number,
  pal: Palette,
  reduceMotion: boolean,
): void {
  ctx.clearRect(0, 0, p.w, p.h);
  drawWater(ctx, p, now, pal, reduceMotion);

  for (const k of p.koi) drawKoi(ctx, k, now, pal, reduceMotion);
  for (const pad of p.pads) drawPad(ctx, pad, pal);

  // Rings last, and added rather than painted, so where two of them cross the
  // water genuinely brightens — the interference is the whole toy.
  const life = ringLife(reduceMotion);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = pal.ring;
  for (const r of p.ripples) {
    const age = (now - r.born) / life;
    if (age >= 1) continue;
    const fade = Math.pow(1 - age, 1.7);

    if (reduceMotion) {
      // a soft glow that simply fades where the finger was
      const rad = ringRadius(p, r, now, true);
      const g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, rad);
      g.addColorStop(0, `rgba(255,255,255,${0.34 * fade})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    const rad = ringRadius(p, r, now, false);
    const lw = p.unit * 0.004;
    ctx.globalAlpha = 0.5 * fade;
    ctx.lineWidth = (lw + lw * 3.4 * (1 - age)) * r.strength;
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
    ctx.stroke();

    // the ring behind the ring
    if (rad > p.unit * 0.045) {
      ctx.globalAlpha = 0.22 * fade;
      ctx.lineWidth = lw * 1.2 * r.strength;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad * 0.74, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
