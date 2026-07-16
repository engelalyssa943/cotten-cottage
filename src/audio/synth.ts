import type { SoundApi } from '../engine/types';

/**
 * Every sound is synthesized with the Web Audio API — no audio files. Six
 * primitives (blip, pop, chime, splash, sparkle, collected); everything else in
 * the app composes from these. Each call pitch-varies slightly so the 50th tap
 * never sounds mechanical.
 */

interface SynthOptions {
  isMuted: () => boolean;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

// Lazily created; browsers require a user gesture before audio can start.
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Vary a frequency by up to `cents` in either direction. */
function vary(base: number, cents = 22): number {
  const c = (Math.random() * 2 - 1) * cents;
  return base * Math.pow(2, c / 1200);
}

// Major pentatonic. Every step lands on a note that agrees with every other one,
// so a child mashing decorations composes something pleasant by construction.
const PENTATONIC = [0, 2, 4, 7, 9];

/** Shift `base` up the pentatonic scale by `step` degrees (undefined = unshifted). */
function stepFreq(base: number, step?: number): number {
  if (step === undefined) return base;
  const len = PENTATONIC.length;
  const octave = Math.floor(step / len);
  const degree = ((step % len) + len) % len;
  return base * Math.pow(2, (PENTATONIC[degree] + octave * 12) / 12);
}

interface ToneSpec {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  attack?: number;
  release?: number;
  gain?: number;
  slideTo?: number;
  delay?: number;
}

function playTone(context: AudioContext, master: GainNode, spec: ToneSpec): void {
  const now = context.currentTime + (spec.delay ?? 0);
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = spec.type ?? 'sine';
  osc.frequency.setValueAtTime(vary(spec.freq), now);
  const dur = spec.dur ?? 0.2;
  if (spec.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(vary(spec.slideTo), now + dur);
  }
  const peak = spec.gain ?? 0.18;
  const attack = spec.attack ?? 0.01;
  const release = spec.release ?? 0.12;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + dur + release);
  osc.connect(g).connect(master);
  osc.start(now);
  osc.stop(now + attack + dur + release + 0.03);
}

export function createSound(opts: SynthOptions): SoundApi {
  function play(specs: ToneSpec[], masterGain = 0.6): void {
    if (opts.isMuted()) return;
    const context = getCtx();
    if (!context) return;
    const master = context.createGain();
    master.gain.value = masterGain;
    master.connect(context.destination);
    for (const s of specs) playTone(context, master, s);
  }

  return {
    blip: (step?: number) => play([{ freq: stepFreq(620, step), type: 'sine', dur: 0.08, gain: 0.16 }]),
    pop: (step?: number) =>
      play([{ freq: stepFreq(360, step), type: 'triangle', dur: 0.06, slideTo: stepFreq(720, step), gain: 0.15 }]),
    chime: (step?: number) =>
      play([
        { freq: stepFreq(880, step), type: 'sine', dur: 0.24, gain: 0.13 },
        { freq: stepFreq(1320, step), type: 'sine', dur: 0.3, gain: 0.08, delay: 0.04 },
      ]),
    splash: () => play([{ freq: 240, type: 'sine', dur: 0.18, slideTo: 120, gain: 0.15 }]),
    sparkle: () =>
      play([
        { freq: 1200, type: 'sine', dur: 0.09, gain: 0.08 },
        { freq: 1600, type: 'sine', dur: 0.09, gain: 0.07, delay: 0.05 },
        { freq: 2000, type: 'sine', dur: 0.1, gain: 0.06, delay: 0.1 },
      ]),
    collected: () =>
      play([
        { freq: 660, type: 'sine', dur: 0.14, gain: 0.15 },
        { freq: 990, type: 'sine', dur: 0.24, gain: 0.13, delay: 0.12 },
      ]),
  };
}
