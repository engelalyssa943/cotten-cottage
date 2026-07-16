import type { GameModule } from '../engine/types';

// THE ONLY FILE TOUCHED WHEN ADDING A GAME.
// Import the module and add it to the array. That's the whole checklist.
import aquarium from './aquarium';
import cakeDecorator from './cake-decorator';

export const GAMES: GameModule[] = [aquarium, cakeDecorator];

// Warn loudly in development if two modules ever share an id (ids are forever).
if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const g of GAMES) {
    if (seen.has(g.id)) console.error(`[registry] duplicate game id: ${g.id}`);
    seen.add(g.id);
  }
}
