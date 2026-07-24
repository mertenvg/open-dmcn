// SentStore is the Sent-folder consumer of the personal storage substrate. A Sent
// entry is NOT a message: it is a record sealed to the owner alone under the "sent/"
// namespace, so saving it never touches onion routing, the relay STORE path, or the
// free-ride guard. It carries the composed plaintext for display, the author
// signature (authorship proof), and each recipient's relay-accept hash (delivery
// breadcrumb + anchor for a future recipient receipt). See the plan's Sent decision.

import { PersonalStore, type StorageEntry } from './personalStore';
import type { WorkingKeys } from '../crypto/workingKeys';

// Attachment metadata only (Phase 1): name/size/contentType, no bytes — keeps Sent
// blobs and the owner's quota small. Byte retention is deferred (plan Phase 4).
export interface SentAttachmentMeta {
  name: string;
  size: number;
  contentType: string;
}

export interface SentEntry {
  v: number;
  messageId: string; // hex (shared across all copies of one compose)
  threadId: string; // hex
  sentAt: number; // unix seconds
  subject: string;
  body: string;
  to: string[];
  cc: string[];
  bcc: string[]; // recorded ONLY here, on the sender's own Sent copy
  attachments: SentAttachmentMeta[];
  authorSig: string; // base64 Ed25519 over sentAuthorBytes()
  acceptHashes: Record<string, string>; // recipientAddress -> envelope_hash (hex)
}

// sentAuthorBytes is the canonical byte serialization the author signature covers:
// a fixed-order array of the identity-bearing fields as UTF-8 JSON. Deterministic,
// so the signature is reproducible and verifiable on any device.
export function sentAuthorBytes(
  e: Pick<SentEntry, 'v' | 'messageId' | 'threadId' | 'sentAt' | 'subject' | 'body' | 'to' | 'cc' | 'bcc'>
): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify([e.v, e.messageId, e.threadId, e.sentAt, e.subject, e.body, e.to, e.cc, e.bcc])
  );
}

export function sentKey(messageIdHex: string): string {
  return 'sent/' + messageIdHex;
}

export class SentStore {
  private store: PersonalStore;

  constructor(keys: WorkingKeys) {
    this.store = new PersonalStore(keys);
  }

  // list returns every Sent entry (each already one row — the shared messageId
  // collapses a multi-recipient send into a single record).
  list(): Promise<StorageEntry<SentEntry>[]> {
    return this.store.list<SentEntry>('sent/');
  }

  put(entry: SentEntry): Promise<number> {
    return this.store.put(sentKey(entry.messageId), entry);
  }

  delete(messageIdHex: string): Promise<void> {
    return this.store.delete(sentKey(messageIdHex));
  }
}
