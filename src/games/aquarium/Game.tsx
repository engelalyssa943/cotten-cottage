import type { GameProps } from '../../engine/types';
import { SproutTank } from './SproutTank';
import { BloomDesigner } from './BloomDesigner';

/**
 * One module, both children. `sprout` gets the living tap-world; everyone older
 * gets the designer. This branch is the pattern for the whole library.
 */
export default function AquariumGame(props: GameProps) {
  return props.band === 'sprout' ? <SproutTank {...props} /> : <BloomDesigner {...props} />;
}
