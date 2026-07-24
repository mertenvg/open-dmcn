// MailFilterClient holds the account's block/allow list. In the DMCN PRODUCT the list
// lived server-side at the mailbox relay (sealed to the owner + the relay) so the relay
// could silently DROP blocked senders at delivery. The OPEN protocol does not carry that
// operator surface, so here the list is browser-local and advisory: it drives the
// client-side trust view (blocked/unknown senders are hidden in the UI), but mail is not
// dropped at the relay. The public interface (get/save/clear + FilterList) is unchanged,
// so useMailFilter and its consumers are untouched.

import { idbGet, idbPut, idbDelete, PERSONAL_STORE } from '../crypto/idb';
import type { WorkingKeys } from '../crypto/workingKeys';

// FilterList mirrors Go's mailfilter.List JSON.
export interface FilterList {
  mode: 'deny' | 'allow';
  domains: string[];
  senders: string[];
  allow_verified?: boolean;
  // Hex ed25519 public keys of blocked identities (§14.3.1). Unlike senders/domains,
  // a sender_keys match ALWAYS hides regardless of mode — a personal blocklist bound
  // to the cryptographic identity, so a blocked sender can't evade by changing their
  // address string.
  sender_keys?: string[];
}

export function emptyFilterList(): FilterList {
  return { mode: 'deny', domains: [], senders: [], allow_verified: false, sender_keys: [] };
}

// The single logical key the filter list is stored under, per account.
const FILTER_KEY = 'filter/list';

export class MailFilterClient {
  // The owner address namespaces the list within the shared per-origin store.
  private owner: string;

  constructor(keys: WorkingKeys) {
    this.owner = keys.address;
  }

  private key(): string {
    return this.owner + '::' + FILTER_KEY;
  }

  // get returns the current filter list, or null if none set.
  async get(): Promise<FilterList | null> {
    const list = await idbGet<FilterList>(PERSONAL_STORE, this.key());
    return list ?? null;
  }

  // save stores the list locally.
  async save(list: FilterList): Promise<void> {
    await idbPut(PERSONAL_STORE, this.key(), list);
  }

  // clear removes the filter (revert to allow-everything).
  async clear(): Promise<void> {
    await idbDelete(PERSONAL_STORE, this.key());
  }
}
