import { db, type CollectionRow, type SaveRow, type SettingRow } from './db';
import type { Profile } from '../engine/types';

/**
 * The backup story: export the entire database as ONE JSON file (photos base64
 * inlined) that the aunt can email herself. This is the only hard guarantee
 * against browser storage eviction, and the migration path to a new tablet.
 * Import is non-destructive: profiles merge by id and are never silently
 * overwritten.
 */

const BACKUP_VERSION = 1;

type ProfileExport = Omit<Profile, 'photoBlob'> & {
  photoBase64?: string;
  photoType?: string;
};

export interface BackupFile {
  app: 'cotten-cottage';
  version: number;
  exportedAt: string;
  profiles: ProfileExport[];
  saves: SaveRow[];
  collections: CollectionRow[];
  settings: SettingRow[];
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, type: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function exportBackup(): Promise<BackupFile> {
  const [profiles, saves, collections, settings] = await Promise.all([
    db.profiles.toArray(),
    db.saves.toArray(),
    db.collections.toArray(),
    db.settings.toArray(),
  ]);
  const profilesExport: ProfileExport[] = await Promise.all(
    profiles.map(async ({ photoBlob, ...rest }) =>
      photoBlob
        ? { ...rest, photoBase64: await blobToBase64(photoBlob), photoType: photoBlob.type }
        : { ...rest },
    ),
  );
  return {
    app: 'cotten-cottage',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: profilesExport,
    saves,
    collections,
    settings,
  };
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cotten-cottage-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): BackupFile {
  const data = JSON.parse(text) as BackupFile;
  if (data.app !== 'cotten-cottage' || typeof data.version !== 'number') {
    throw new Error('This file is not a Cotten Cottage backup.');
  }
  return data;
}

export interface ImportPlan {
  /** Profiles in the file that are not on this device — safe to add. */
  newProfiles: ProfileExport[];
  /** Profiles whose id already exists here — skipped unless explicitly overwritten. */
  existingProfiles: ProfileExport[];
}

export async function planImport(backup: BackupFile): Promise<ImportPlan> {
  const existingIds = new Set((await db.profiles.toArray()).map((p) => p.id));
  return {
    newProfiles: backup.profiles.filter((p) => !existingIds.has(p.id)),
    existingProfiles: backup.profiles.filter((p) => existingIds.has(p.id)),
  };
}

/**
 * Apply an import. New profiles (and their saves/collections) are added. Existing
 * profiles are left untouched unless their id is passed in `overwriteIds`.
 */
export async function applyImport(backup: BackupFile, overwriteIds: string[] = []): Promise<void> {
  const overwrite = new Set(overwriteIds);
  const existingIds = new Set((await db.profiles.toArray()).map((p) => p.id));
  const accept = (id: string) => !existingIds.has(id) || overwrite.has(id);
  const acceptedIds = new Set(backup.profiles.filter((p) => accept(p.id)).map((p) => p.id));

  await db.transaction('rw', db.profiles, db.saves, db.collections, db.settings, async () => {
    for (const p of backup.profiles) {
      if (!accept(p.id)) continue;
      const { photoBase64, photoType, ...rest } = p;
      const profile: Profile = {
        ...rest,
        ...(photoBase64 ? { photoBlob: base64ToBlob(photoBase64, photoType ?? 'image/jpeg') } : {}),
      };
      await db.profiles.put(profile);
    }
    for (const s of backup.saves) if (acceptedIds.has(s.profileId)) await db.saves.put(s);
    for (const c of backup.collections) if (acceptedIds.has(c.profileId)) await db.collections.put(c);
    // Global settings only fill gaps — never clobber this device's local prefs.
    for (const st of backup.settings) {
      if (!(await db.settings.get(st.key))) await db.settings.put(st);
    }
  });
}
