import Dexie, { type Table } from 'dexie';
import type { Profile } from '../engine/types';

// The whole data model is local. There is no server, ever.

export interface SaveRow {
  profileId: string;
  gameId: string;
  data: unknown;
  updatedAt: number;
}

export interface CollectionRow {
  profileId: string;
  collectibleId: string;
  foundAt: number;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export class CottageDB extends Dexie {
  profiles!: Table<Profile, string>;
  saves!: Table<SaveRow, [string, string]>;
  collections!: Table<CollectionRow, [string, string]>;
  settings!: Table<SettingRow, string>;

  constructor() {
    super('cotten-cottage');
    this.version(1).stores({
      profiles: 'id, createdAt',
      saves: '[profileId+gameId], profileId',
      collections: '[profileId+collectibleId], profileId',
      settings: 'key',
    });
  }
}

export const db = new CottageDB();
