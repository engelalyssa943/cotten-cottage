import type { CollectibleDef } from '../../engine/types';
import { ItemThumb } from './items';
import type { Look, Slot } from './types';

/**
 * Four outfits that quietly reveal a sparkle piece.
 *
 * Discovery only — nothing lists them, nothing counts them, nothing ever says a
 * look is missing one. Putting the combination together is the whole event, and
 * the revealed piece then lives in the tray forever.
 */

function piece(
  id: string,
  slot: Slot,
  kind: string,
  color: string,
  title: string,
  story: string,
): CollectibleDef {
  return {
    id,
    title,
    story,
    themes: ['cute', 'animals'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <ItemThumb slot={slot} kind={kind} color={color} size={104} />
      </div>
    ),
  };
}

export const DRESS_UP_COLLECTIBLES: CollectibleDef[] = [
  piece(
    'dress-up:star-crown',
    'head',
    'starcrown',
    '#F6C948',
    'Star Crown',
    'It only appears for someone already wearing stars under a starry sky.',
  ),
  piece(
    'dress-up:petal-gown',
    'outfit',
    'petalgown',
    '#F7B4CE',
    'Petal Gown',
    'The meadow lent every flower it had to make this one.',
  ),
  piece(
    'dress-up:aurora-wings',
    'wings',
    'aurora',
    '#C4A6E6',
    'Aurora Wings',
    'Ribbons and dancing shoes together made her wings light up.',
  ),
  piece(
    'dress-up:cloud-boots',
    'shoes',
    'cloudboots',
    '#A9C9F0',
    'Cloud Boots',
    'Cosy enough for a walk right across the sky.',
  ),
];

/** The tray piece each discovery reveals. */
export const UNLOCKS: Record<string, { slot: Slot; kind: string }> = {
  'dress-up:star-crown': { slot: 'head', kind: 'starcrown' },
  'dress-up:petal-gown': { slot: 'outfit', kind: 'petalgown' },
  'dress-up:aurora-wings': { slot: 'wings', kind: 'aurora' },
  'dress-up:cloud-boots': { slot: 'shoes', kind: 'cloudboots' },
};

/** Every discovery this look currently satisfies (re-checked on every change). */
export function discoveriesFor(look: Look): string[] {
  const head = look.head?.kind;
  const outfit = look.outfit?.kind;
  const shoes = look.shoes?.kind;
  const wings = look.wings?.kind;
  const face = look.face?.kind;

  const out: string[] = [];
  if (head === 'crown' && face === 'starcheeks' && look.scene === 'night') out.push('dress-up:star-crown');
  if (head === 'flowers' && outfit === 'dress' && look.scene === 'meadow') out.push('dress-up:petal-gown');
  if (outfit === 'tutu' && wings === 'ribbons' && shoes === 'ballet') out.push('dress-up:aurora-wings');
  if (outfit === 'sweater' && shoes === 'boots' && look.scene === 'clouds') out.push('dress-up:cloud-boots');
  return out;
}
