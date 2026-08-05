import type { FC } from 'react';
import type { SoundApi } from '../../engine/types';

/**
 * Six friends who live in the cupboards.
 *
 * Every one is inline SVG in a shared 120x120 box, and every voice is built
 * from the six sound primitives — there is no recorded audio anywhere in this
 * app, so a dog is two low barks rather than someone saying "dog". Rhythm and
 * pitch are what make them tell each other apart, which a one-year-old reads
 * long before words.
 */

export type Animal = 'cat' | 'dog' | 'bird' | 'frog' | 'mouse' | 'bunny';

export const ANIMALS: Animal[] = ['cat', 'dog', 'bird', 'frog', 'mouse', 'bunny'];

export const ANIMAL_NAME: Record<Animal, string> = {
  cat: 'Cat',
  dog: 'Dog',
  bird: 'Bird',
  frog: 'Frog',
  mouse: 'Mouse',
  bunny: 'Bunny',
};

const COAT: Record<Animal, { fur: string; deep: string; belly: string }> = {
  cat: { fur: '#F5A55E', deep: '#DE8B45', belly: '#FFE6CC' },
  dog: { fur: '#C79363', deep: '#A97848', belly: '#F5E3CE' },
  bird: { fur: '#6FBEE8', deep: '#4F9FCB', belly: '#DCF0FB' },
  frog: { fur: '#82C86E', deep: '#63A752', belly: '#DFF3D6' },
  mouse: { fur: '#C9BFD6', deep: '#A79BB8', belly: '#F1ECF7' },
  bunny: { fur: '#F7D8E4', deep: '#E0B4C6', belly: '#FFF3F7' },
};

/** Two eyes and a smile, shared by everyone. */
function Face({ eyeProps }: { eyeProps: EyeProps }) {
  return (
    <g>
      <g {...eyeProps}>
        <ellipse cx="48" cy="60" rx="7" ry="7.5" fill="#3E3340" />
        <ellipse cx="72" cy="60" rx="7" ry="7.5" fill="#3E3340" />
        <circle cx="45.5" cy="57" r="2.4" fill="#FFFFFF" />
        <circle cx="69.5" cy="57" r="2.4" fill="#FFFFFF" />
      </g>
      <path d="M52 76 q 8 7 16 0" stroke="#3E3340" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  );
}

type EyeProps = { className?: string; style?: { animationDelay: string } };

/**
 * `still` is for the Collection Book and any thumbnail — a card in a book
 * shouldn't be winking at you. Blinking is CSS rather than React state so six
 * animals blinking on their own schedules costs no re-renders at all.
 */
export const AnimalSVG: FC<{
  animal: Animal;
  size?: number;
  still?: boolean;
  /** Seconds of offset, so they don't all blink in unison. */
  delay?: number;
  className?: string;
}> = ({ animal, size = 120, still = false, delay = 0, className }) => {
  const c = COAT[animal];
  const eyeProps: EyeProps = still ? {} : { className: 'cc-eye', style: { animationDelay: `${delay}s` } };
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden style={{ overflow: 'visible' }}>
      {/* ears / crest, behind the head */}
      {animal === 'cat' && (
        <>
          <path d="M26 40 L30 12 L52 30 Z" fill={c.fur} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
          <path d="M94 40 L90 12 L68 30 Z" fill={c.fur} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
        </>
      )}
      {animal === 'dog' && (
        <>
          {/* long and low, so he reads as a dog rather than a bear */}
          <ellipse cx="21" cy="66" rx="12" ry="30" fill={c.deep} />
          <ellipse cx="99" cy="66" rx="12" ry="30" fill={c.deep} />
        </>
      )}
      {animal === 'bunny' && (
        <>
          <ellipse cx="42" cy="16" rx="9" ry="26" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <ellipse cx="78" cy="16" rx="9" ry="26" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <ellipse cx="42" cy="18" rx="4" ry="17" fill={c.belly} />
          <ellipse cx="78" cy="18" rx="4" ry="17" fill={c.belly} />
        </>
      )}
      {animal === 'mouse' && (
        <>
          <circle cx="30" cy="34" r="18" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <circle cx="90" cy="34" r="18" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <circle cx="30" cy="34" r="10" fill="#F6C9D8" />
          <circle cx="90" cy="34" r="10" fill="#F6C9D8" />
        </>
      )}
      {animal === 'bird' && (
        // three feathers rooted in the head, not a dot hovering above it
        <g fill="#F6C948">
          <path d="M60 30 q -12 -14 -4 -24 q 10 4 10 22 Z" />
          <path d="M60 30 q 0 -18 2 -28 q 8 10 4 28 Z" />
          <path d="M60 30 q 12 -12 16 -20 q 2 12 -8 22 Z" />
        </g>
      )}
      {animal === 'frog' && (
        <>
          <circle cx="36" cy="30" r="16" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <circle cx="84" cy="30" r="16" fill={c.fur} stroke={c.deep} strokeWidth="2" />
          <circle cx="36" cy="30" r="7" fill="#FFFFFF" />
          <circle cx="84" cy="30" r="7" fill="#FFFFFF" />
          <g {...eyeProps}>
            <circle cx="36" cy="31" r="4" fill="#3E3340" />
            <circle cx="84" cy="31" r="4" fill="#3E3340" />
          </g>
        </>
      )}

      {/* head */}
      <circle cx="60" cy="62" r="38" fill={c.fur} stroke={c.deep} strokeWidth="2.5" />
      <ellipse cx="60" cy="74" rx="24" ry="18" fill={c.belly} />

      {/* frog's eyes live up on the stalks, so it only gets a mouth */}
      {animal === 'frog' ? (
        <path d="M44 74 q 16 14 32 0" stroke="#3E3340" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      ) : (
        <Face eyeProps={eyeProps} />
      )}

      {/* muzzles and beaks — the frog gets neither, its wide mouth is the face */}
      {animal === 'bird' && <path d="M60 64 L74 72 L60 78 Z" fill="#F6A93F" />}
      {animal !== 'bird' && animal !== 'frog' && (
        <ellipse cx="60" cy="70" rx="5" ry="3.6" fill="#3E3340" />
      )}
      {animal === 'cat' && (
        <g stroke="#3E3340" strokeWidth="2" strokeLinecap="round">
          <path d="M34 68 L18 64 M34 74 L18 76" />
          <path d="M86 68 L102 64 M86 74 L102 76" />
        </g>
      )}
    </svg>
  );
};

/**
 * A voice per animal, spaced out in time. The setTimeouts here schedule notes —
 * they are a rhythm, not a countdown.
 */
export function speak(animal: Animal, sound: SoundApi): void {
  const at = (ms: number, fn: () => void) => window.setTimeout(fn, ms);
  switch (animal) {
    case 'cat': // a rising me-ow
      sound.chime(2);
      at(160, () => sound.chime(4));
      break;
    case 'dog': // two low barks
      sound.pop(0);
      at(200, () => sound.pop(0));
      break;
    case 'bird': // a quick high tweet
      sound.blip(6);
      at(90, () => sound.blip(7));
      at(180, () => sound.blip(6));
      break;
    case 'frog': // two slow low ribbits
      sound.pop(1);
      at(300, () => sound.pop(0));
      break;
    case 'mouse': // two tiny squeaks
      sound.blip(7);
      at(110, () => sound.blip(7));
      break;
    case 'bunny': // a hop and a sparkle
      sound.pop(3);
      at(150, () => sound.sparkle());
      break;
  }
}
