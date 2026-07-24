// Working keys: the unlocked identity keys as NON-EXTRACTABLE CryptoKey handles,
// persisted in IndexedDB. The private key bytes never sit in a JS-reachable string
// (unlike the old sessionStorage 'dmcn_keys' blob), so an XSS on the origin has
// nothing to exfiltrate — it can still *call* sign/deriveBits while the page is open
// (use, not theft), which the CSP/SRI hardening is there to shrink.
//
// importEd25519PrivateKey / importX25519PrivateKey already import with
// extractable=false, so the handles cannot be exported back to raw bytes. Operations
// that genuinely need raw bytes (pairing-out, export) re-derive them transiently from
// the encrypted keystore via reauth.ts — they do not read these handles.

import type { IdentityKeyPair } from './keys';
import { importEd25519PrivateKey, importX25519PrivateKey } from './keys';
import { WORKING_STORE, idbGet, idbGetAllKeys, idbPut, idbDelete } from './idb';

export interface WorkingKeys {
  ed25519Sign: CryptoKey;     // non-extractable, ['sign']
  x25519Derive: CryptoKey;    // non-extractable, ['deriveBits']
  ed25519Public: Uint8Array;  // 32 bytes (public, non-secret)
  x25519Public: Uint8Array;   // 32 bytes (public, non-secret)
  deviceId: Uint8Array;       // 16 bytes
  createdAt: number;          // Unix seconds
  address: string;            // owning account (validates the handle matches the session)
}

// Handles are keyed by a session ref (see sessionLifetime.workingKeyRef): per-tab
// ('tab:<id>') by default so they die with the tab, or per-account ('acct:<addr>')
// for stay-signed-in. A tab carries one account at a time, so the address field lets
// us reject a per-tab handle that belongs to a different account.

// importWorkingKeys turns a freshly-decrypted raw key pair into non-extractable
// handles for `address`. The caller discards the raw IdentityKeyPair afterwards.
export async function importWorkingKeys(address: string, kp: IdentityKeyPair): Promise<WorkingKeys> {
  const seed = kp.ed25519Private.slice(0, 32);
  const [ed25519Sign, x25519Derive] = await Promise.all([
    importEd25519PrivateKey(seed),
    importX25519PrivateKey(kp.x25519Private),
  ]);
  return {
    ed25519Sign,
    x25519Derive,
    ed25519Public: kp.ed25519Public,
    x25519Public: kp.x25519Public,
    deviceId: kp.deviceId,
    createdAt: kp.createdAt,
    address,
  };
}

export async function saveWorkingKeys(ref: string, wk: WorkingKeys): Promise<void> {
  // CryptoKey objects are structured-cloneable; the private bytes never serialize.
  await idbPut(WORKING_STORE, ref, wk);
}

export async function loadWorkingKeys(ref: string): Promise<WorkingKeys | null> {
  try {
    const wk = await idbGet<WorkingKeys>(WORKING_STORE, ref);
    return wk ?? null;
  } catch {
    return null;
  }
}

export async function clearWorkingKeys(ref: string): Promise<void> {
  try {
    await idbDelete(WORKING_STORE, ref);
  } catch {
    /* ignore */
  }
}

// gcWorkingHandles removes handles no longer referenceable: per-tab handles whose tab
// is no longer open (its id isn't in the live set — a closed-tab orphan), per-account
// handles when stay-signed-in is off, and any legacy/unknown keys. Orphans are
// non-extractable and unreferenceable, but removing them promptly (the moment any tab
// opens after a browser close) shrinks the XSS-reachable residual to near zero.
export async function gcWorkingHandles(staySignedIn: boolean, liveTabIds: Set<string>): Promise<void> {
  try {
    const keys = await idbGetAllKeys(WORKING_STORE);
    await Promise.all(keys.map(async k => {
      if (k.startsWith('tab:')) {
        if (!liveTabIds.has(k.slice('tab:'.length))) await idbDelete(WORKING_STORE, k);
      } else if (k.startsWith('acct:')) {
        if (!staySignedIn) await idbDelete(WORKING_STORE, k);
      } else {
        await idbDelete(WORKING_STORE, k); // legacy 'identity' / unknown
      }
    }));
  } catch {
    /* ignore */
  }
}
