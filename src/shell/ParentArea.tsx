import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { AgeBand, Profile, Room } from '../engine/types';
import { GAMES } from '../games/registry';
import { BANDS, resolveBand } from '../engine/bands';
import { SWATCHES, DEFAULT_SWATCH } from '../theme/swatches';
import { useApp } from '../store/app';
import { requestPersistence, getStorageState, type StorageState } from '../db/persist';
import {
  exportBackup,
  downloadBackup,
  parseBackup,
  planImport,
  applyImport,
  type BackupFile,
} from '../db/backup';
import {
  detectPlatform,
  isStandalone,
  canPromptInstall,
  promptInstall,
  onInstallChange,
} from '../pwa/install';

const ROOM_LABEL: Record<Room, string> = {
  kitchen: 'Kitchen',
  workshop: 'Workshop',
  sunroom: 'Sunroom',
  garden: 'Garden',
  attic: 'Attic',
  door: "Aunt Alyssa's Door",
};

const BAND_LABEL: Record<AgeBand, string> = {
  sprout: 'Sprout (0–2)',
  bud: 'Bud (3–4)',
  bloom: 'Bloom (5–7)',
  star: 'Star (8+)',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-cozy bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function SwatchGrid({ value, onPick }: { value: string; onPick: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((s) => (
        <button
          key={s.id}
          onClick={() => onPick(s.hex)}
          aria-label={s.name}
          className={`h-10 w-10 rounded-full shadow-sm ${value.toLowerCase() === s.hex.toLowerCase() ? 'ring-4 ring-ink/30' : ''}`}
          style={{ background: s.hex }}
        />
      ))}
    </div>
  );
}

function ChildCard({ profile }: { profile: Profile }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saves = useLiveQuery(() => db.saves.where('profileId').equals(profile.id).toArray(), [profile.id]) ?? [];
  const found = useLiveQuery(() => db.collections.where('profileId').equals(profile.id).count(), [profile.id]) ?? 0;

  const rooms = new Set<Room>();
  for (const s of saves) {
    const g = GAMES.find((game) => game.id === s.gameId);
    g?.rooms.forEach((r) => rooms.add(r));
  }
  const roomNames = [...rooms].map((r) => ROOM_LABEL[r]);
  const summary =
    saves.length === 0
      ? 'No adventures yet.'
      : `${profile.name} has been in ${listPhrase(roomNames)}` +
        (found > 0 ? `, and has found ${found} treasure${found === 1 ? '' : 's'}.` : '.');

  const update = (patch: Partial<Profile>) => db.profiles.update(profile.id, patch);

  return (
    <div className="rounded-cozy border border-ink/10 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <input
          value={profile.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-40 rounded-cozy bg-cream px-3 py-2 text-ink"
          aria-label="Name"
        />
        <label className="text-sm text-ink/60">
          Birthday
          <input
            type="month"
            value={profile.birthMonth}
            onChange={(e) => update({ birthMonth: e.target.value })}
            className="ml-2 rounded-cozy bg-cream px-2 py-1 text-ink"
          />
        </label>
        <label className="text-sm text-ink/60">
          Level
          <select
            value={profile.pinnedBand ?? 'auto'}
            onChange={(e) =>
              update({ pinnedBand: e.target.value === 'auto' ? undefined : (e.target.value as AgeBand) })
            }
            className="ml-2 rounded-cozy bg-cream px-2 py-1 text-ink"
          >
            <option value="auto">Auto ({BAND_LABEL[resolveBand(profile)]})</option>
            {BANDS.map((b) => (
              <option key={b} value={b}>
                {BAND_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-sm text-ink/60">Favorite color</div>
        <SwatchGrid value={profile.favoriteColor} onPick={(hex) => update({ favoriteColor: hex })} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-pill bg-cc-100 px-4 py-2 text-sm text-ink shadow-sm active:scale-95"
        >
          {profile.photoBlob ? 'Change photo' : 'Add photo'}
        </button>
        {profile.photoBlob && (
          <button
            onClick={() => update({ photoBlob: undefined })}
            className="rounded-pill px-3 py-2 text-sm text-ink/50"
          >
            Remove photo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void update({ photoBlob: file });
            e.target.value = '';
          }}
        />
      </div>

      <p className="mt-3 text-sm text-ink/60">{summary}</p>

      <div className="mt-3 text-right">
        {confirmDelete ? (
          <span className="text-sm">
            <span className="mr-2 text-ink/70">Delete {profile.name} and everything they made?</span>
            <button
              onClick={async () => {
                await db.transaction('rw', db.profiles, db.saves, db.collections, async () => {
                  await db.saves.where('profileId').equals(profile.id).delete();
                  await db.collections.where('profileId').equals(profile.id).delete();
                  await db.profiles.delete(profile.id);
                });
              }}
              className="rounded-pill bg-red-400 px-3 py-1 text-white"
            >
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)} className="ml-2 rounded-pill px-3 py-1 text-ink/60">
              Keep
            </button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-sm text-ink/40 hover:text-red-400">
            Delete child
          </button>
        )}
      </div>
    </div>
  );
}

export function ParentArea() {
  const pop = useApp((s) => s.pop);
  const mute = useApp((s) => s.mute);
  const setMute = useApp((s) => s.setMute);
  const reduceMotion = useApp((s) => s.reduceMotion);
  const setReduceMotion = useApp((s) => s.setReduceMotion);
  const windDownMinutes = useApp((s) => s.windDownMinutes);
  const setWindDownMinutes = useApp((s) => s.setWindDownMinutes);

  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray()) ?? [];

  const [addName, setAddName] = useState('');
  const [addMonth, setAddMonth] = useState('');
  const [addColor, setAddColor] = useState(DEFAULT_SWATCH.hex);
  const [storage, setStorage] = useState<StorageState | null>(null);
  const [installTick, setInstallTick] = useState(0);
  const [importPreview, setImportPreview] = useState<{ backup: BackupFile; nNew: number; nExisting: number } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refreshStorage = () => void getStorageState().then(setStorage);
  useEffect(() => {
    refreshStorage();
    return onInstallChange(() => setInstallTick((t) => t + 1));
  }, []);

  async function addChild() {
    if (!addName.trim() || !addMonth) return;
    const first = (await db.profiles.count()) === 0;
    await db.profiles.add({
      id: crypto.randomUUID(),
      name: addName.trim(),
      birthMonth: addMonth,
      favoriteColor: addColor,
      favoriteAnimals: [],
      favoriteThemes: [],
      createdAt: Date.now(),
    });
    setAddName('');
    setAddMonth('');
    setAddColor(DEFAULT_SWATCH.hex);
    if (first) {
      await requestPersistence();
      refreshStorage();
    }
  }

  async function onImportFile(file: File) {
    const backup = parseBackup(await file.text());
    const plan = await planImport(backup);
    setImportPreview({ backup, nNew: plan.newProfiles.length, nExisting: plan.existingProfiles.length });
  }

  const platform = detectPlatform();
  const installed = isStandalone();
  void installTick; // re-render trigger for install state changes

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-cream p-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink">Grown-up area</h1>
          <button onClick={pop} className="rounded-pill bg-white px-5 py-2 shadow-sm active:scale-95">
            Done
          </button>
        </div>

        <Section title="Children">
          <div className="space-y-4">
            {profiles.map((p) => (
              <ChildCard key={p.id} profile={p} />
            ))}
          </div>
          <div className="mt-4 rounded-cozy bg-cream p-4">
            <div className="mb-2 text-sm font-medium text-ink/70">Add a child</div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Name"
                className="w-40 rounded-cozy bg-white px-3 py-2 text-ink"
              />
              <input
                type="month"
                value={addMonth}
                onChange={(e) => setAddMonth(e.target.value)}
                className="rounded-cozy bg-white px-2 py-2 text-ink"
                aria-label="Birthday month"
              />
            </div>
            <div className="mt-3">
              <SwatchGrid value={addColor} onPick={setAddColor} />
            </div>
            <button
              onClick={() => void addChild()}
              disabled={!addName.trim() || !addMonth}
              className="mt-3 rounded-pill bg-accent px-5 py-2 text-white shadow-sm active:scale-95 disabled:opacity-40"
            >
              Add child
            </button>
          </div>
        </Section>

        <Section title="Sound & motion">
          <label className="flex items-center justify-between py-2">
            <span className="text-ink">Sound</span>
            <input type="checkbox" checked={!mute} onChange={(e) => setMute(!e.target.checked)} className="h-6 w-6" />
          </label>
          <label className="flex items-center justify-between py-2">
            <span className="text-ink">Gentle motion (less movement)</span>
            <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} className="h-6 w-6" />
          </label>
        </Section>

        <Section title="Wind-down">
          <p className="mb-2 text-sm text-ink/60">
            After a while, whatever's on screen gently saves and the app drifts to the pond at dusk.
            No hard cut-off, no meltdown.
          </p>
          <select
            value={windDownMinutes}
            onChange={(e) => setWindDownMinutes(Number(e.target.value))}
            className="rounded-cozy bg-cream px-3 py-2 text-ink"
          >
            <option value={0}>Off</option>
            <option value={15}>After 15 minutes</option>
            <option value={20}>After 20 minutes</option>
            <option value={30}>After 30 minutes</option>
            <option value={45}>After 45 minutes</option>
          </select>
        </Section>

        <Section title="Backup">
          <p className="mb-3 text-sm text-ink/60">
            One file with everything — profiles, creations, photos, and treasures. Email it to
            yourself; it's the real safety net, and how you'd move to a new tablet.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => downloadBackup(await exportBackup())}
              className="rounded-pill bg-accent px-5 py-2 text-white shadow-sm active:scale-95"
            >
              Export backup
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="rounded-pill bg-cc-100 px-5 py-2 text-ink shadow-sm active:scale-95"
            >
              Import backup
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
                e.target.value = '';
              }}
            />
          </div>
          {importPreview && (
            <div className="mt-3 rounded-cozy bg-cream p-3 text-sm">
              <p className="mb-2 text-ink/70">
                This backup has {importPreview.nNew} new child
                {importPreview.nNew === 1 ? '' : 'ren'} to add
                {importPreview.nExisting > 0
                  ? `, and ${importPreview.nExisting} already here (these will be left untouched).`
                  : '.'}
              </p>
              <button
                onClick={async () => {
                  await applyImport(importPreview.backup);
                  setImportPreview(null);
                  refreshStorage();
                }}
                className="rounded-pill bg-accent px-4 py-1 text-white"
              >
                Add them
              </button>
              <button onClick={() => setImportPreview(null)} className="ml-2 rounded-pill px-4 py-1 text-ink/60">
                Cancel
              </button>
            </div>
          )}
        </Section>

        <Section title="Is this safe on the tablet?">
          {storage === null ? (
            <p className="text-ink/50">Checking…</p>
          ) : storage.persisted ? (
            <p className="text-ink">✅ Backed up and safe on this tablet.</p>
          ) : (
            <div>
              <p className="text-ink">
                ⚠️ Your tablet may clear this over time. Add Cotten Cottage to the home screen
                (below) and keep an exported backup.
              </p>
              <button
                onClick={async () => {
                  await requestPersistence();
                  refreshStorage();
                }}
                className="mt-2 rounded-pill bg-cc-100 px-4 py-2 text-sm text-ink shadow-sm active:scale-95"
              >
                Try to protect it
              </button>
            </div>
          )}
        </Section>

        <Section title="Add to the tablet">
          {installed ? (
            <p className="text-ink">✅ Cotten Cottage is installed on the home screen.</p>
          ) : platform === 'ios' ? (
            <div className="text-ink/80">
              <p className="mb-2">On iPad/iPhone, add it from Safari:</p>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>
                  Tap the <strong>Share</strong> button{' '}
                  <span className="inline-block align-middle">
                    <svg viewBox="0 0 24 24" className="inline h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 16V4M8 8l4-4 4 4M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </li>
                <li>Scroll to <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ol>
            </div>
          ) : platform === 'android' && canPromptInstall() ? (
            <button
              onClick={() => void promptInstall()}
              className="rounded-pill bg-accent px-5 py-2 text-white shadow-sm active:scale-95"
            >
              Add to tablet
            </button>
          ) : (
            <p className="text-ink/70">
              Use your browser's menu → <strong>Install app</strong> / <strong>Add to Home Screen</strong>.
            </p>
          )}
          <p className="mt-3 text-sm text-ink/60">
            Tip: once it's on the home screen, turn on <strong>Guided Access</strong> (iPad) or{' '}
            <strong>Screen Pinning</strong> (Android) to lock the tablet to Cotten Cottage.
          </p>
        </Section>
      </div>
    </div>
  );
}

function listPhrase(items: string[]): string {
  if (items.length === 0) return 'the cottage';
  if (items.length === 1) return `the ${items[0]}`;
  if (items.length === 2) return `the ${items[0]} and the ${items[1]}`;
  return `the ${items.slice(0, -1).join(', the ')}, and the ${items[items.length - 1]}`;
}
