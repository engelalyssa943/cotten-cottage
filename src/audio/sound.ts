import { createSound } from './synth';
import { useApp } from '../store/app';

/** The app-wide sound singleton, wired to the global mute flag. */
export const sound = createSound({ isMuted: () => useApp.getState().mute });
