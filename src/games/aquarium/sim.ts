import type { Species } from './art';

/**
 * The living tank. One simulation shared by both bands: `sprout` stocks it with a
 * fixed shoal, `bloom` stocks it with whatever fish she placed. Decorations stay
 * where they're put; fish come alive.
 *
 * Nothing in here is a goal, a timer or a score — it is all just behaviour.
 */

export type Temperament = 'darty' | 'lazy' | 'curious';

interface TemperSpec {
  speed: number;
  pause: [number, number];
  decide: [number, number];
  amp: number;
  curiosity: number;
}

const TEMPER: Record<Temperament, TemperSpec> = {
  darty: { speed: 1.55, pause: [0.12, 0.5], decide: [0.7, 1.8], amp: 1.4, curiosity: 0.85 },
  lazy: { speed: 0.5, pause: [1.4, 3.8], decide: [2.4, 5.5], amp: 0.5, curiosity: 0.3 },
  curious: { speed: 1.0, pause: [0.4, 1.3], decide: [1.4, 3.0], amp: 1.0, curiosity: 1 },
};

export const TEMPERAMENTS: Temperament[] = ['darty', 'lazy', 'curious'];

/**
 * A special species' gait IS its character, so it must not be scaled by whatever
 * temperament it happened to roll. Left scaled, a "lazy" jellyfish drifts at
 * ~5px/s and a lazy seahorse takes half a minute to reach a plant — you'd simply
 * never see them do the thing that makes them themselves. Fixed px/sec instead.
 */
const DRIFT_SPEED = 22; // jellyfish, going wherever it likes
const CLING_SPEED = 70; // seahorse, on its way to a plant
const PATROL_SPEED = 42; // angelfish, never hurrying

type Style = 'normal' | 'drifter' | 'clinger' | 'regal';

/** The discovered creatures each move in a way that's unmistakably theirs. */
const STYLE: Record<Species, Style> = {
  clownfish: 'normal',
  tang: 'normal',
  sunny: 'normal',
  goldie: 'normal',
  jelly: 'drifter',
  seahorse: 'clinger',
  angelfish: 'regal',
};

export interface SimFish {
  key: string;
  species: Species;
  style: Style;
  temperament: Temperament;
  x: number;
  y: number;
  baseY: number;
  homeY: number;
  dir: 1 | -1;
  size: number;
  speed: number;
  phase: number;
  freq: number;
  amp: number;
  pauseUntil: number;
  nextDecision: number;
  blinkNext: number;
  blinkFor: number;
  spin: number;
  bob: number;
  followOff: { x: number; y: number };
  target: { x: number; y: number; until: number } | null;
  entering: boolean;
  enterTo: { x: number; y: number } | null;
}

export interface Flake {
  id: number;
  x: number;
  y: number;
  vy: number;
}

export interface SimEnv {
  w: number;
  h: number;
  /** Where a finger is currently held, if it is. */
  attractor: { x: number; y: number } | null;
  flakes: Flake[];
  /** Plant positions in px, so the seahorse has something to hold onto. */
  plants: { x: number; y: number }[];
  /** Slowed to a hush during a discovery. */
  timeScale: number;
  reduceMotion: boolean;
  onEat?: (f: Flake) => void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function createFish(opts: {
  key: string;
  species: Species;
  x: number;
  y: number;
  size?: number;
  temperament?: Temperament;
  entering?: boolean;
  enterTo?: { x: number; y: number };
}): SimFish {
  const temperament = opts.temperament ?? pick(TEMPERAMENTS);
  const t = TEMPER[temperament];
  const now = performance.now();
  return {
    key: opts.key,
    species: opts.species,
    style: STYLE[opts.species],
    temperament,
    x: opts.x,
    y: opts.y,
    baseY: opts.y,
    homeY: opts.enterTo?.y ?? opts.y,
    dir: Math.random() < 0.5 ? 1 : -1,
    size: opts.size ?? rand(112, 150),
    speed: rand(32, 46) * t.speed,
    phase: rand(0, Math.PI * 2),
    freq: rand(0.7, 1.3),
    amp: rand(9, 17) * t.amp,
    pauseUntil: 0,
    nextDecision: now + rand(...t.decide) * 1000,
    blinkNext: now + rand(600, 5000),
    blinkFor: 0,
    spin: 0,
    bob: rand(0, Math.PI * 2),
    followOff: { x: rand(-58, 58), y: rand(-38, 38) },
    target: null,
    entering: opts.entering ?? false,
    enterTo: opts.enterTo ?? null,
  };
}

/** Send a couple of fish over to look at something new. Curious ones go first. */
export function investigate(fish: SimFish[], x: number, y: number, now: number): void {
  const candidates = fish
    .filter((f) => f.style !== 'drifter' && !f.entering)
    .map((f) => ({ f, score: Math.hypot(f.x - x, f.y - y) / (0.4 + TEMPER[f.temperament].curiosity) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);
  for (const { f } of candidates) f.target = { x, y, until: now + 2600 };
}

function stepInner(f: SimFish, env: SimEnv, dtRaw: number, now: number): void {
  const dt = dtRaw * env.timeScale;
  const t = TEMPER[f.temperament];
  const slow = env.reduceMotion ? 0.55 : 1;

  // Blinking — the cheapest life there is.
  if (now >= f.blinkNext) {
    f.blinkFor = 0.12;
    f.blinkNext = now + rand(2200, 7400);
  }
  if (f.blinkFor > 0) f.blinkFor = Math.max(0, f.blinkFor - dtRaw);
  if (f.spin > 0) f.spin = Math.max(0, f.spin - dt);
  f.bob += dt * 1.6;
  f.phase += f.freq * dt;

  const swimTo = (tx: number, ty: number, mult: number) => {
    const dx = tx - f.x;
    const dy = ty - f.y;
    const d = Math.hypot(dx, dy) || 1;
    f.dir = dx >= 0 ? 1 : -1;
    const sp = f.speed * mult * slow;
    f.x += (dx / d) * sp * dt;
    f.y += (dy / d) * sp * dt;
    f.baseY = f.y;
    return d;
  };

  // 1. Making an entrance (a newly discovered creature swimming in).
  if (f.entering && f.enterTo) {
    if (swimTo(f.enterTo.x, f.enterTo.y, 1.5) < 16) {
      f.entering = false;
      f.homeY = f.enterTo.y;
      f.spin = 0.5;
    }
    return;
  }

  // 2. The jellyfish answers to nobody. It just drifts and pulses.
  if (f.style === 'drifter') {
    f.x += f.dir * DRIFT_SPEED * slow * dt;
    if (f.x < env.w * 0.08) f.dir = 1;
    if (f.x > env.w * 0.92) f.dir = -1;
    f.baseY += Math.sin(f.bob * 0.35) * 14 * slow * dt;
    f.baseY = Math.min(Math.max(f.baseY, env.h * 0.12), env.h * 0.7);
    f.y = f.baseY + Math.sin(f.bob) * 6;
    return;
  }

  // 3. Somewhere to be?
  if (f.target && now < f.target.until) {
    if (swimTo(f.target.x, f.target.y, 1.9) < 12) {
      f.target = null;
      f.spin = 0.45;
    }
    return;
  }
  f.target = null;

  // 4. Food beats everything else.
  if (env.flakes.length > 0) {
    let best: Flake | null = null;
    let bd = Infinity;
    for (const fl of env.flakes) {
      const d = Math.hypot(fl.x - f.x, fl.y - f.y);
      if (d < bd) {
        bd = d;
        best = fl;
      }
    }
    if (best) {
      if (swimTo(best.x, best.y, f.style === 'regal' ? 1.1 : 2.1) < 16) {
        env.flakes.splice(env.flakes.indexOf(best), 1);
        env.onEat?.(best);
        f.spin = 0.4;
      }
      return;
    }
  }

  // 5. A finger to follow.
  if (env.attractor) {
    const want = t.curiosity;
    if (want > 0.25) {
      swimTo(env.attractor.x + f.followOff.x, env.attractor.y + f.followOff.y, 0.9 + want * 0.7);
      return;
    }
  }

  // 6. The seahorse wants a plant to hold onto.
  if (f.style === 'clinger') {
    let anchor = { x: f.x, y: f.baseY };
    let bd = Infinity;
    for (const p of env.plants) {
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < bd) {
        bd = d;
        anchor = p;
      }
    }
    const tx = anchor.x + 34;
    const ty = anchor.y - 54;
    if (Math.hypot(tx - f.x, ty - f.baseY) > 18) swimTo(tx, ty, CLING_SPEED / f.speed);
    f.y = f.baseY + Math.sin(f.bob * 0.8) * 7;
    return;
  }

  // 7. The angelfish patrols, grandly, and never hurries.
  if (f.style === 'regal') {
    f.x += f.dir * PATROL_SPEED * slow * dt;
    if (f.x < env.w * 0.14) f.dir = 1;
    if (f.x > env.w * 0.86) f.dir = -1;
    f.baseY += (f.homeY - f.baseY) * 0.4 * dt;
    f.y = f.baseY + Math.sin(f.phase) * f.amp * 0.5;
    return;
  }

  // 8. Otherwise: wander, in the manner of your temperament.
  if (now < f.pauseUntil) {
    f.baseY += (f.homeY - f.baseY) * 0.5 * dt;
    f.y = f.baseY + Math.sin(f.phase) * f.amp * 0.45;
    return;
  }
  if (now > f.nextDecision) {
    const pauses = f.temperament === 'lazy' ? 0.55 : f.temperament === 'curious' ? 0.3 : 0.15;
    if (Math.random() < pauses) f.pauseUntil = now + rand(...t.pause) * 1000;
    else if (Math.random() < 0.4) f.dir = f.dir === 1 ? -1 : 1;
    f.nextDecision = now + rand(...t.decide) * 1000;
  }
  f.x += f.dir * f.speed * slow * dt;
  if (f.x < env.w * 0.06) {
    f.x = env.w * 0.06;
    f.dir = 1;
  } else if (f.x > env.w * 0.94) {
    f.x = env.w * 0.94;
    f.dir = -1;
  }
  f.baseY += (f.homeY - f.baseY) * 0.5 * dt;
  f.y = f.baseY + Math.sin(f.phase) * f.amp;
}

/** Advance one fish, then keep it in the water (never under the gravel or in the air). */
export function step(f: SimFish, env: SimEnv, dtRaw: number, now: number): void {
  stepInner(f, env, dtRaw, now);
  if (f.entering) return;
  const top = env.h * 0.1;
  const bottom = env.h * 0.8;
  f.baseY = Math.min(Math.max(f.baseY, top), bottom);
  f.homeY = Math.min(Math.max(f.homeY, top), bottom);
  f.y = Math.min(Math.max(f.y, top - 8), bottom + 8);
  f.x = Math.min(Math.max(f.x, env.w * 0.05), env.w * 0.95);
}

/** Nearer the bottom of the tank = nearer the glass: bigger, sharper, in front. */
export function depthOf(y: number, h: number) {
  const d = Math.min(1, Math.max(0, y / Math.max(1, h)));
  return { scale: 0.74 + d * 0.46, z: Math.round(100 + d * 400), opacity: 0.82 + d * 0.18 };
}

// Per-frame DOM lookups add up fast (one query per fish per frame is ~360/sec at
// 60fps). Resolve each fish's eye once and remember it against its element.
const eyeCache = new WeakMap<HTMLElement, SVGGElement | null>();
const lastPaint = new WeakMap<HTMLElement, { z: number; blink: boolean }>();

function eyeOf(el: HTMLElement): SVGGElement | null {
  let eye = eyeCache.get(el);
  if (eye === undefined) {
    eye = el.querySelector<SVGGElement>('[data-eye]');
    eyeCache.set(el, eye);
  }
  return eye;
}

/** Write a fish's current state straight to the DOM — no React re-render per frame. */
export function paintFish(el: HTMLElement, f: SimFish, env: SimEnv): void {
  const { scale, z, opacity } = depthOf(f.y, env.h);
  const spinDeg = f.spin > 0 ? (1 - f.spin / 0.5) * 360 : 0;
  const pulse = f.style === 'drifter' ? 1 + Math.sin(f.bob) * 0.09 : 1;
  el.style.transform =
    `translate(${f.x}px, ${f.y}px) translate(-50%, -50%) scale(${scale * pulse}) ` +
    `rotate(${spinDeg}deg) scaleX(${f.dir === 1 ? -1 : 1})`;

  // z and the blink only change occasionally — don't dirty style every frame.
  const blink = f.blinkFor > 0;
  const prev = lastPaint.get(el);
  if (!prev || prev.z !== z) {
    el.style.zIndex = String(z);
    el.style.opacity = String(opacity);
  }
  if (!prev || prev.blink !== blink) {
    const eye = eyeOf(el);
    if (eye) eye.style.transform = blink ? 'scaleY(0.12)' : '';
  }
  if (!prev || prev.z !== z || prev.blink !== blink) lastPaint.set(el, { z, blink });
}

/** How much a plant should sway, and bend away from any fish pushing through it. */
export function plantMotion(
  px: number,
  py: number,
  fish: SimFish[],
  now: number,
  reduceMotion: boolean,
): { sway: number; bend: number } {
  const sway = Math.sin(now / 1400 + px * 0.02) * (reduceMotion ? 1.2 : 3.2);
  let bend = 0;
  const R = 120;
  for (const f of fish) {
    const d = Math.hypot(f.x - px, f.y - py);
    if (d < R) {
      const push = (1 - d / R) * (reduceMotion ? 5 : 15);
      bend += px >= f.x ? push : -push;
    }
  }
  return { sway, bend: Math.max(-22, Math.min(22, bend)) };
}
