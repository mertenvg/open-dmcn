// PersonalStore is the browser-local store for the owner's per-account mail state:
// Sent messages, read/unread + labels, contacts, and settings. Logical keys are
// "<namespace>/<id>" — e.g. "sent/<messageIdHex>", "flags/<messageHash>",
// "contacts/<id>", "settings/app"; list() takes a "<namespace>/" prefix.
//
// In the DMCN PRODUCT this rode a zero-knowledge personal-KV substrate on the mailbox
// relay (sealed to the owner, synced across devices). The OPEN protocol deliberately
// does not carry that operator surface, so the reference client keeps this state in the
// browser's IndexedDB ONLY — it is single-device and never leaves the machine. The public
// interface (get/put/list/listKeys/delete/stat + StorageEntry/StorageUsage/CAS) is
// unchanged, so the higher stores (sent/flags/labels/contacts/settings) are untouched.
//
// Storage is namespaced by the owner's address so multiple accounts in one browser never
// collide (mirroring the product's per-account server namespacing). A per-key monotonic
// version supports the same optional compare-and-swap the callers already use.

import { idbGet, idbGetAllKeys, idbPut, idbDelete, PERSONAL_STORE } from '../crypto/idb';
import type { WorkingKeys } from '../crypto/workingKeys';

// StorageUsage is the owner's personal-storage occupancy for the Settings meter.
// quotaBytes === 0 means no cap (the browser's own storage limits apply, not a relay quota).
export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  count: number;
}

// A decoded entry. value is the parsed plaintext object.
export interface StorageEntry<T> {
  key: string;
  value: T;
  version: number;
}

// StorageConflictError is thrown by put() when a compare-and-swap fails; the caller
// should re-read and retry.
export class StorageConflictError extends Error {
  constructor(msg = 'storage version conflict') {
    super(msg);
    this.name = 'StorageConflictError';
  }
}

// record is the physical shape stored in IndexedDB under the namespaced key.
interface record<T> {
  value: T;
  version: number;
}

export class PersonalStore {
  // The owner address namespaces this account's keys within the shared per-origin store.
  private owner: string;

  constructor(keys: WorkingKeys) {
    this.owner = keys.address;
  }

  // ns maps a logical key ("sent/<id>") to its physical IndexedDB key, scoped to the owner.
  private ns(key: string): string {
    return this.owner + '::' + key;
  }

  // get returns the parsed object + version for a key, or null if absent.
  async get<T>(key: string): Promise<StorageEntry<T> | null> {
    const rec = await idbGet<record<T>>(PERSONAL_STORE, this.ns(key));
    if (!rec) return null;
    return { key, value: rec.value, version: rec.version };
  }

  // put writes an object and returns the new version. When expectedVersion is provided
  // (> 0) the write is a compare-and-swap: a mismatch throws StorageConflictError.
  async put(key: string, obj: unknown, expectedVersion = 0): Promise<number> {
    const physKey = this.ns(key);
    const cur = await idbGet<record<unknown>>(PERSONAL_STORE, physKey);
    const curVersion = cur ? cur.version : 0;
    if (expectedVersion > 0 && expectedVersion !== curVersion) {
      throw new StorageConflictError();
    }
    const version = curVersion + 1;
    await idbPut(PERSONAL_STORE, physKey, { value: obj, version } satisfies record<unknown>);
    return version;
  }

  // list returns all entries under a namespace prefix (e.g. "sent/").
  async list<T>(prefix: string): Promise<StorageEntry<T>[]> {
    const entries = await this.listInternal<T>(prefix, true);
    return entries;
  }

  // listKeys lists the keys under a prefix without loading values.
  async listKeys(prefix: string): Promise<{ key: string; version: number }[]> {
    const entries = await this.listInternal<unknown>(prefix, false);
    return entries.map(e => ({ key: e.key, version: e.version }));
  }

  private async listInternal<T>(prefix: string, withValues: boolean): Promise<StorageEntry<T>[]> {
    const physPrefix = this.ns(prefix);
    const keys = await idbGetAllKeys(PERSONAL_STORE);
    const out: StorageEntry<T>[] = [];
    for (const physKey of keys) {
      if (!physKey.startsWith(physPrefix)) continue;
      const logical = physKey.slice((this.owner + '::').length);
      const rec = await idbGet<record<T>>(PERSONAL_STORE, physKey);
      if (!rec) continue;
      out.push({ key: logical, value: withValues ? rec.value : (undefined as unknown as T), version: rec.version });
    }
    return out;
  }

  async delete(key: string): Promise<void> {
    await idbDelete(PERSONAL_STORE, this.ns(key));
  }

  // stat reports this account's local personal-storage usage. quotaBytes is 0 (no relay
  // quota applies to browser-local storage); usedBytes is an approximation from a JSON
  // serialization of the stored values.
  async stat(): Promise<StorageUsage> {
    const entries = await this.list<unknown>('');
    let usedBytes = 0;
    for (const e of entries) {
      usedBytes += new TextEncoder().encode(JSON.stringify(e.value)).length;
    }
    return { usedBytes, quotaBytes: 0, count: entries.length };
  }
}
