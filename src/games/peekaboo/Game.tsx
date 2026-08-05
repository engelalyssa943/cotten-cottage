import type { GameProps } from '../../engine/types';
import { Cupboards } from './Cupboards';
import { FindIt } from './FindIt';

/**
 * One module, two ages. `sprout` gets pure peekaboo — open a door, somebody is
 * there. Everyone older gets somebody to look for, which is the same cupboards
 * doing memory work instead.
 */
export default function PeekabooGame(props: GameProps) {
  return props.band === 'sprout' ? <Cupboards {...props} /> : <FindIt {...props} />;
}
