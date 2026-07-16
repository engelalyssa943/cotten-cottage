import { create } from 'zustand';
import { db } from '../db/db';
import type { Room } from '../engine/types';

/**
 * App-level state: who's playing, the in-memory screen stack (no router), and the
 * global mute / reduce-motion / wind-down settings (persisted to the settings table).
 */

export type Screen =
  | { kind: 'profiles' }
  | { kind: 'cottage' }
  | { kind: 'room'; room: Room }
  | { kind: 'game'; gameId: string }
  | { kind: 'parent' }
  | { kind: 'winddown' };

interface AppState {
  activeProfileId: string | null;
  stack: Screen[];
  mute: boolean;
  reduceMotion: boolean;
  /** Minutes until wind-down begins; 0 = off. */
  windDownMinutes: number;
  hydrated: boolean;

  setActiveProfile: (id: string | null) => void;
  push: (s: Screen) => void;
  pop: () => void;
  reset: (s: Screen) => void;
  setMute: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setWindDownMinutes: (m: number) => void;
  hydrate: () => Promise<void>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const useApp = create<AppState>((set) => ({
  activeProfileId: null,
  stack: [{ kind: 'profiles' }],
  mute: false,
  reduceMotion: prefersReducedMotion(),
  windDownMinutes: 0,
  hydrated: false,

  setActiveProfile: (id) => set({ activeProfileId: id }),
  push: (s) => set((st) => ({ stack: [...st.stack, s] })),
  pop: () => set((st) => (st.stack.length > 1 ? { stack: st.stack.slice(0, -1) } : {})),
  reset: (s) => set({ stack: [s] }),

  setMute: (v) => {
    set({ mute: v });
    void db.settings.put({ key: 'mute', value: v });
  },
  setReduceMotion: (v) => {
    set({ reduceMotion: v });
    void db.settings.put({ key: 'reduceMotion', value: v });
  },
  setWindDownMinutes: (m) => {
    set({ windDownMinutes: m });
    void db.settings.put({ key: 'windDownMinutes', value: m });
  },

  hydrate: async () => {
    const [mute, rm, wd] = await db.settings.bulkGet(['mute', 'reduceMotion', 'windDownMinutes']);
    set({
      mute: typeof mute?.value === 'boolean' ? mute.value : false,
      reduceMotion: typeof rm?.value === 'boolean' ? rm.value : prefersReducedMotion(),
      windDownMinutes: typeof wd?.value === 'number' ? wd.value : 0,
      hydrated: true,
    });
  },
}));

export const currentScreen = (s: Pick<AppState, 'stack'>): Screen => s.stack[s.stack.length - 1];
