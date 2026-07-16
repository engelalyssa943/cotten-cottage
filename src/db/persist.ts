/**
 * Storage persistence. Browsers evict IndexedDB under pressure, and Safari clears a
 * non-installed site after ~7 days. We request persistence on first profile creation
 * and surface the result in plain language in the Parent Area (no API names).
 */

export interface StorageState {
  supported: boolean;
  persisted: boolean;
  usageBytes?: number;
  quotaBytes?: number;
}

export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    const granted = await navigator.storage.persist();
    console.info(`[storage] persist() -> ${granted ? 'granted' : 'denied'}`);
    return granted;
  } catch {
    return false;
  }
}

export async function getStorageState(): Promise<StorageState> {
  const supported = typeof navigator.storage?.persisted === 'function';
  if (!supported) return { supported: false, persisted: false };
  const persisted = await navigator.storage.persisted();
  let usageBytes: number | undefined;
  let quotaBytes: number | undefined;
  if (navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    usageBytes = est.usage;
    quotaBytes = est.quota;
  }
  return { supported, persisted, usageBytes, quotaBytes };
}
