// Client-side encrypted keystore. The encrypted key blob lives ONLY here (IndexedDB)
// and is never sent to or stored by the server — "backup" in the sense of persistent
// server custody is gone. It is the at-rest copy this device re-unlocks from after a
// tab close, and the source of raw bytes (via reauth.ts) for pairing-out and export.
//
// The blob is gated by a passkey (WebAuthn PRF) where available, or an Argon2id-
// wrapped passphrase as the weaker fallback. The record also carries the public
// material and unlock metadata so the unlock screen can identify the account and pick
// the unlock method without decrypting anything.

import type { EncryptedBundle } from './keystore';
import { type IdentityKeyPair, toBase64 } from './keys';
import { KEYSTORE_STORE, WORKING_STORE, idbGet, idbGetAll, idbPut, idbDelete } from './idb';

export type AuthMethod = 'password' | 'passkey';

export interface LocalKeystore {
  address: string;
  version: number;          // identity record version (for republish bookkeeping)
  bundle: EncryptedBundle;  // the encrypted identity-key blob
  authMethod: AuthMethod;
  credentialId?: string;    // base64 (passkey path)
  prfSalt?: string;         // base64 (passkey path)
  ed25519Public: string;    // base64 (public, for display / address binding)
  x25519Public: string;     // base64
  deviceId: string;         // base64
  createdAt: number;        // Unix seconds
}

// Records are keyed by account address so several identities can coexist on one
// browser profile. LEGACY_KEY is the old single-slot key, migrated once on startup.
const LEGACY_KEY = 'identity';

// makeLocalKeystore assembles a record from a key pair, its encrypted blob, and the
// chosen unlock method — the shape Register / Import / Pair persist after building a
// bundle. The private bytes are only inside `bundle` (already encrypted).
export function makeLocalKeystore(params: {
  address: string;
  kp: IdentityKeyPair;
  bundle: EncryptedBundle;
  authMethod: AuthMethod;
  credentialId?: string;
  prfSalt?: string;
  version?: number;
}): LocalKeystore {
  return {
    address: params.address,
    version: params.version ?? 1,
    bundle: params.bundle,
    authMethod: params.authMethod,
    credentialId: params.credentialId,
    prfSalt: params.prfSalt,
    ed25519Public: toBase64(params.kp.ed25519Public),
    x25519Public: toBase64(params.kp.x25519Public),
    deviceId: toBase64(params.kp.deviceId),
    createdAt: params.kp.createdAt,
  };
}

export async function saveLocalKeystore(ks: LocalKeystore): Promise<void> {
  await idbPut(KEYSTORE_STORE, ks.address, ks);
}

export async function loadLocalKeystore(address: string): Promise<LocalKeystore | null> {
  try {
    const ks = await idbGet<LocalKeystore>(KEYSTORE_STORE, address);
    return ks ?? null;
  } catch {
    return null;
  }
}

// listLocalKeystores returns every identity provisioned on this device (for the
// account picker). The first call also migrates any legacy single-slot record.
export async function listLocalKeystores(): Promise<LocalKeystore[]> {
  try {
    await migrateLegacyKeystore();
    return await idbGetAll<LocalKeystore>(KEYSTORE_STORE);
  } catch {
    return [];
  }
}

export async function clearLocalKeystore(address: string): Promise<void> {
  try {
    await idbDelete(KEYSTORE_STORE, address);
  } catch {
    /* ignore */
  }
}

// migrateLegacyKeystore re-keys the pre-multi-account record (stored under the
// constant 'identity') to its address, and drops the legacy working handles so the
// account re-unlocks cleanly. Idempotent and safe to call repeatedly.
export async function migrateLegacyKeystore(): Promise<void> {
  try {
    const old = await idbGet<LocalKeystore>(KEYSTORE_STORE, LEGACY_KEY);
    if (old?.address) {
      await idbPut(KEYSTORE_STORE, old.address, old);
      await idbDelete(KEYSTORE_STORE, LEGACY_KEY);
    }
    // Legacy working handles can't be reliably re-keyed; drop them (re-unlock derives
    // fresh ones keyed by address).
    await idbDelete(WORKING_STORE, LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
