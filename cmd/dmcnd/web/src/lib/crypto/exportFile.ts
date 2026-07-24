// User-held encrypted backup file — the total-device-loss safety net. The user
// downloads it and stores it themselves; the server never holds it. It can be
// protected two ways:
//   - passphrase: Argon2id-wrapped. Portable anywhere, but the user must remember it.
//   - passkey:    WebAuthn-PRF-wrapped. No passphrase to remember; opens on any device
//                 where that passkey is available. For a SYNCED passkey (iCloud
//                 Keychain, Google Password Manager, a password manager) that's every
//                 synced device; for a device-bound authenticator (a hardware security
//                 key) it's only that authenticator. The app can't tell which, so the
//                 UI warns. Importing on a new device runs the same possession-proof.

import { encryptKeys, decryptKeys, encryptKeysWithKey, decryptKeysWithKey, type EncryptedBundle } from './keystore';
import { unlockPasskeyPRF } from './passkey';
import { keyPairToPayloadJSON } from './keys';
import { type IdentityKeyPair, keyPairFromPayloadJSON, toBase64 } from './keys';

export const EXPORT_FORMAT = 'dmcn-keystore-export';
export type ExportAuth = 'password' | 'passkey';

export interface KeystoreExport {
  format: typeof EXPORT_FORMAT;
  version: 1;
  address: string;
  ed25519Public: string;   // base64, for at-a-glance identification
  authMethod: ExportAuth;
  credentialId?: string;   // base64 (passkey path)
  prfSalt?: string;        // base64 (passkey path)
  bundle: EncryptedBundle; // the wrapped key payload
}

function payloadOf(kp: IdentityKeyPair): Uint8Array {
  return new TextEncoder().encode(keyPairToPayloadJSON(kp));
}

export async function buildPasswordExport(address: string, kp: IdentityKeyPair, passphrase: string): Promise<KeystoreExport> {
  const bundle = await encryptKeys(payloadOf(kp), passphrase);
  return { format: EXPORT_FORMAT, version: 1, address, ed25519Public: toBase64(kp.ed25519Public), authMethod: 'password', bundle };
}

export async function buildPasskeyExport(
  address: string,
  kp: IdentityKeyPair,
  passkey: { credentialId: string; prfSalt: string; aesKey: CryptoKey },
): Promise<KeystoreExport> {
  const bundle = await encryptKeysWithKey(payloadOf(kp), passkey.aesKey);
  return {
    format: EXPORT_FORMAT,
    version: 1,
    address,
    ed25519Public: toBase64(kp.ed25519Public),
    authMethod: 'passkey',
    credentialId: passkey.credentialId,
    prfSalt: passkey.prfSalt,
    bundle,
  };
}

export interface ReadExportResult {
  kp: IdentityKeyPair;
  // Present only for a passkey-protected backup: the PRF key + its metadata from the
  // unlock assertion. A successful passkey read proves that credential exists on THIS
  // device, so the importer can re-wrap the local keystore under the SAME passkey —
  // avoiding a second enrollment (which would mint a colliding credential) and a
  // second WebAuthn prompt.
  passkey?: { credentialId: string; prfSalt: string; aesKey: CryptoKey };
}

// readExport decrypts a backup. Passphrase exports need opts.password; passkey exports
// trigger a WebAuthn assertion against the stored credential and return the derived
// key so the caller can reuse it without prompting again.
export async function readExport(exp: KeystoreExport, opts?: { password?: string }): Promise<ReadExportResult> {
  if (exp?.format !== EXPORT_FORMAT) throw new Error('not a DMCN keystore export file');
  if (exp.authMethod === 'passkey') {
    if (!exp.credentialId || !exp.prfSalt) throw new Error('backup is missing passkey metadata');
    const aesKey = await unlockPasskeyPRF(exp.credentialId, exp.prfSalt);
    const bytes = await decryptKeysWithKey(exp.bundle, aesKey);
    return { kp: keyPairFromPayloadJSON(bytes), passkey: { credentialId: exp.credentialId, prfSalt: exp.prfSalt, aesKey } };
  }
  if (!opts?.password) throw new Error('passphrase required');
  const bytes = await decryptKeys(exp.bundle, opts.password);
  return { kp: keyPairFromPayloadJSON(bytes) };
}

// triggerDownload writes the export to a file the user saves locally.
export function triggerDownload(exp: KeystoreExport): void {
  const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safe = exp.address.replace(/[^a-z0-9._@-]/gi, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `dmcn-keystore-${safe}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
