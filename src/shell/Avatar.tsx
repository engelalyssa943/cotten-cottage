import { useEffect, useState } from 'react';
import type { Profile } from '../engine/types';
import { resolveTheme } from '../theme/resolve';

/** A profile's face: their photo if set, else their first initial in their color. */
export function Avatar({ profile, size = 96 }: { profile: Profile; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.photoBlob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(profile.photoBlob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profile.photoBlob]);

  const theme = resolveTheme(profile.favoriteColor);
  return (
    <div
      className="grid place-items-center overflow-hidden rounded-full shadow-md"
      style={{ width: size, height: size, background: theme.scale[300], border: `4px solid ${theme.scale[500]}` }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span style={{ fontSize: size * 0.44, color: theme.ink, fontWeight: 600 }}>
          {profile.name.slice(0, 1).toUpperCase() || '·'}
        </span>
      )}
    </div>
  );
}
