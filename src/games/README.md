# Adding a game (in under five minutes)

A game is a self-contained folder that default-exports a `GameModule`. Adding one
touches **exactly one** file outside its own folder: `src/games/registry.ts`.

## Steps

1. **Copy the skeleton.** Duplicate `src/games/_TEMPLATE/` to `src/games/<your-game-id>/`.
   The id is permanent — kebab-case, never renamed or reused (e.g. `bubble-pop`).

2. **Fill in `index.tsx`.** This is the module — the app reads it to place your game:
   - `id`, `title`
   - `rooms`: one or more of `kitchen · workshop · sunroom · garden · attic · door`.
     A room with no games for a child's band simply doesn't appear for that child, so
     shipping the first Workshop game makes the Workshop room show up on its own.
   - `bands`: only the bands you actually built for (`sprout 0–2`, `bud 3–4`, `bloom 5–7`,
     `star 8+`). A band you omit hides the game from those children.
   - `themes`, an inline-SVG `Icon`, and `collectibles` (optional) with the art + story
     the Attic's Collection Book shows.

3. **Build `Game.tsx`.** Default-export a `React.FC<GameProps>`. Everything arrives as
   props — see `src/engine/types.ts`:
   - `band` and `theme` are already resolved. Branch on `band` to serve different ages
     from one module (see `aquarium`).
   - `save.load()` / `save.put()` — an opaque, debounced, per-(profile, game) JSON blob.
   - `award(id)` — idempotent; the engine plays the sound and renders the sparkle.
   - `sound`, `reduceMotion`, and `onExit`. **Never render your own back button** —
     call `onExit`. Gate motion behind `reduceMotion`.

4. **Register it.** Add two lines to `src/games/registry.ts`:
   ```ts
   import myGame from './my-game';
   export const GAMES: GameModule[] = [/* … */, myGame];
   ```

That's it. No switch statements, no central unions, no navigation edits.

## The house rules (non-negotiable)

- **No fail states.** No losing, no game over, no wrong-answer buzzer. A wrong tap gets a
  neutral or gently encouraging response and the child continues.
- **No pressure mechanics.** No timers/countdowns, streaks, scores, or anything missable.
- **No reading required to navigate.** Buttons must read as pictures. Text is decoration.
- **No external assets.** Every visual is SVG/CSS/canvas in code; every sound comes from
  `sound`. No image or audio files, no network at runtime.
- **Touch-first, landscape tablet.** Respect the band's minimum hit-target size
  (`sprout` ≥ 120px, `bud` ≥ 96px, `bloom` ≥ 64px, `star` ≥ 48px).
