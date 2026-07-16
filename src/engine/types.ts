import type { FC, LazyExoticComponent } from 'react';

/**
 * THE GAME MODULE CONTRACT.
 *
 * Everything else in the app exists to serve this file. Adding a game means:
 * create a folder under src/games/<id>/, write a module that default-exports a
 * GameModule, and add one line to src/games/registry.ts. Nothing else is touched.
 */

export type AgeBand = 'sprout' | 'bud' | 'bloom' | 'star';

export type Room = 'kitchen' | 'workshop' | 'sunroom' | 'garden' | 'attic' | 'door';

export type ThemeTag =
  | 'ocean'
  | 'space'
  | 'cooking'
  | 'building'
  | 'animals'
  | 'garden'
  | 'cute'
  | 'fidget';

/** Convention: `${gameId}:${slug}`, globally unique and stable forever. */
export type CollectibleId = string;

export interface CollectibleDef {
  id: CollectibleId;
  /** Short name shown in the Collection Book when found. */
  title: string;
  /** One gentle sentence revealed when the item is found. */
  story: string;
  themes?: ThemeTag[];
  /** Renders a soft silhouette when !found, full color when found. */
  Art: FC<{ found: boolean; className?: string }>;
}

export type ThemeScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface ResolvedTheme {
  /** The base favorite color the child picked. */
  favorite: string;
  paint: string;
  paintDeep: string;
  accent: string;
  accentSoft: string;
  ink: string;
  cream: string;
  sky: string;
  /** A soft, high-lightness tint/shade ramp derived from the favorite color. */
  scale: Record<ThemeScaleStep, string>;
}

export interface SoundApi {
  /** `step` shifts the note up a pentatonic scale, so sequences of taps make a
   *  little melody instead of the same click 50 times. Omit it for the plain sound.
   *  The scale means a wrong note is not reachable. */
  blip(step?: number): void;
  pop(step?: number): void;
  chime(step?: number): void;
  splash(): void;
  sparkle(): void;
  /** Two-note "collected!" motif. */
  collected(): void;
}

export interface Profile {
  id: string;
  name: string;
  photoBlob?: Blob;
  /** 'YYYY-MM'. Age (and therefore band) is derived so it advances on its own. */
  birthMonth: string;
  favoriteColor: string;
  favoriteAnimals: string[];
  favoriteThemes: ThemeTag[];
  /** A parent can pin a band manually; the child never sees a label for this. */
  pinnedBand?: AgeBand;
  createdAt: number;
}

export interface GameSaveApi {
  /** Opaque per-(profile, game) blob. Null when nothing has been saved yet. */
  load: <T>() => Promise<T | null>;
  /** Debounced write; never blocks the UI. */
  put: <T>(data: T) => void;
}

export interface GameProps {
  /** Read-only. Games must not mutate profile state directly. */
  profile: Readonly<Profile>;
  /** Already resolved. The game renders for exactly this band. */
  band: AgeBand;
  /** Resolved palette from the child's favorite color. */
  theme: ResolvedTheme;
  save: GameSaveApi;
  /** Idempotent. Awarding an already-owned collectible is a silent no-op. */
  award: (id: CollectibleId) => void;
  sound: SoundApi;
  reduceMotion: boolean;
  /** Games never render their own back button. */
  onExit: () => void;
}

export interface GameModule {
  /** Stable forever. Never renamed, never reused. */
  id: string;
  title: string;
  /** A game may sit in more than one room. A room with zero games for a child's
   *  band is not rendered for that child. */
  rooms: Room[];
  /** Which bands this game supports. Absent band = game hidden for that child. */
  bands: AgeBand[];
  themes: ThemeTag[];
  /** Inline SVG component. No image files. */
  Icon: FC<{ className?: string }>;
  /** Lazily loaded so 100 games don't ship in one bundle. */
  Game: LazyExoticComponent<FC<GameProps>>;
  /** Everything this game can award, with the art + story the Collection Book needs. */
  collectibles?: CollectibleDef[];
  /** Only used by the 'door' room. Within 14 days = sparkle + "new!" ribbon. */
  publishedAt?: string;
}
