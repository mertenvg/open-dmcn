// Passkey-based keystore unlock via the WebAuthn PRF extension (CTAP2 hmac-secret).
//
// Standard WebAuthn only authenticates; the PRF extension additionally returns a
// stable, high-entropy 32-byte secret per (credential, salt) that never leaves the
// authenticator. We HKDF that secret into an AES-GCM key and use it to encrypt the
// keystore blob — so only this passkey can decrypt the identity keys. The server
// never sees the secret and performs no WebAuthn ceremony (login still proves
// possession of the DMCN key); the passkey purely gates local decryption.

import { toBase64, fromBase64 } from './keys';

const PRF_INFO = new TextEncoder().encode('dmcn-webkeys-prf-v1');

// Shown when the chosen passkey provider doesn't implement the WebAuthn PRF
// extension (hmac-secret) we need to derive a key. Some third-party password
// managers (e.g. NordPass) save the passkey but don't support PRF; the device's
// built-in passkey (Touch ID / Windows Hello / Android) does. Naming the fix keeps
// users from getting stuck.
const PRF_UNSUPPORTED_MSG =
  "this passkey provider doesn't support the PRF extension DMCN needs to protect your keys. " +
  'Use your device’s built-in passkey (Touch ID, Windows Hello, Android) or choose a password instead.';

// isPasskeySupported is a coarse capability gate (WebAuthn present + secure
// context). True PRF support can only be confirmed by attempting an enrollment,
// so createPasskeyPRF throws if the authenticator lacks PRF and the UI falls back
// to a password.
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials &&
    window.isSecureContext
  );
}

async function aesKeyFromPRF(secret: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: PRF_INFO },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// evalPRF performs an assertion against an existing credential and returns the
// PRF output for the given salt (undefined if the authenticator declined PRF).
async function evalPRF(credentialId: Uint8Array, prfSalt: Uint8Array): Promise<ArrayBuffer | undefined> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      // DMCN only ever mints platform (built-in) passkeys — see the
      // authenticatorAttachment: 'platform' in createPasskeyPRF — so pin the
      // descriptor to the 'internal' transport. Without this hint the browser can't
      // tell the credential lives on this device, falls back to the generic picker,
      // and shows a cross-device QR code that routes to whatever passkey provider the
      // scanning phone offers (e.g. NordPass / 1Password, which lack the PRF
      // extension) instead of the local Touch ID / Windows Hello / Keychain
      // authenticator that actually holds the key. Synced platform passkeys still
      // appear as 'internal' on each signed-in device, so this stays portable across a
      // user's own Apple/Google devices; the intentionally-excluded cross-device phone
      // flow is covered by the password path.
      allowCredentials: [{ type: 'public-key', id: credentialId, transports: ['internal'] }],
      userVerification: 'required',
      extensions: { prf: { eval: { first: prfSalt } } },
    } as PublicKeyCredentialRequestOptions,
  })) as PublicKeyCredential | null;
  if (!assertion) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = assertion.getClientExtensionResults() as any;
  return ext?.prf?.results?.first as ArrayBuffer | undefined;
}

export interface PasskeyEnrollment {
  credentialId: string; // base64
  prfSalt: string; // base64
  aesKey: CryptoKey;
}

// createPasskeyPRF enrolls a new passkey for the address and returns the derived
// AES key plus the credential id + PRF salt to persist. Throws if the platform
// doesn't support PRF (caller should fall back to a password).
export async function createPasskeyPRF(address: string): Promise<PasskeyEnrollment> {
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));
  // A FRESH RANDOM user handle per enrollment — deliberately NOT the address. WebAuthn
  // deletes ("evicts") an existing discoverable credential only when a new one is
  // created for the same (rpId, user.id) pair. Platform authenticators — iCloud
  // Keychain especially — create discoverable passkeys even when we request
  // residentKey: 'discouraged', so keying user.id to the address made every
  // re-enrollment collide: importing a passkey backup wraps the local keystore under a
  // new passkey, which silently deleted the credential the backup file itself
  // references, leaving that file un-reimportable. A unique handle removes the
  // collision so credentials coexist instead of overwriting each other. DMCN never
  // uses the handle (it always supplies the credential id via allowCredentials and
  // persists only credentialId/prfSalt); the address stays the human-visible name.
  const userHandle = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'DMCN', id: location.hostname },
      user: {
        id: userHandle,
        name: address,
        displayName: address,
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      // Restrict to the device's built-in authenticator (Touch ID / Windows Hello /
      // Android / iCloud Keychain). These reliably support PRF, and on most systems
      // this narrows the picker so third-party password managers that lack PRF (e.g.
      // NordPass) don't intercept enrollment. Apple/Google platform passkeys still
      // sync, so a passkey-protected backup stays portable. Roaming security keys and
      // the cross-device phone flow are excluded by design — the password path covers
      // anyone who needs those.
      // residentKey: 'discouraged' asks for a non-discoverable (server-side) credential.
      // DMCN always supplies the credential id via allowCredentials, so it never needs
      // discoverability. This is only a hint, though — platform authenticators (iCloud
      // Keychain especially) create discoverable passkeys regardless — so it is the
      // unique user handle above, NOT this flag, that actually stops a re-enrollment
      // from evicting an existing credential. The flag still helps on authenticators
      // that honor it by keeping the OS passkey list uncluttered.
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'discouraged',
        userVerification: 'required',
      },
      // Evaluate PRF during creation. A platform authenticator on a current browser
      // returns the result in this same ceremony, so no second prompt is needed.
      extensions: { prf: { eval: { first: prfSalt } } },
    } as PublicKeyCredentialCreationOptions,
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('passkey creation was cancelled');

  const credentialId = new Uint8Array(cred.rawId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = cred.getClientExtensionResults() as any;
  // Fast path: PRF result returned at creation → single prompt. Otherwise (older
  // browsers/authenticators that only evaluate PRF during an assertion) fall back to
  // a follow-up get(). `enabled` is advisory and unreliable, so we gate only on the
  // actual result, not on it.
  let secret: ArrayBuffer | undefined = ext?.prf?.results?.first;
  if (!secret) {
    secret = await evalPRF(credentialId, prfSalt);
  }
  if (!secret) {
    // eslint-disable-next-line no-console
    console.warn('[passkey] PRF unavailable for this authenticator', { prfEnabledAtCreate: ext?.prf?.enabled });
    throw new Error(PRF_UNSUPPORTED_MSG);
  }

  return {
    credentialId: toBase64(credentialId),
    prfSalt: toBase64(prfSalt),
    aesKey: await aesKeyFromPRF(new Uint8Array(secret)),
  };
}

// unlockPasskeyPRF re-derives the AES key on login via an assertion against the
// stored credential + PRF salt.
export async function unlockPasskeyPRF(credentialIdB64: string, prfSaltB64: string): Promise<CryptoKey> {
  const secret = await evalPRF(fromBase64(credentialIdB64), fromBase64(prfSaltB64));
  if (!secret) {
    throw new Error(PRF_UNSUPPORTED_MSG);
  }
  return aesKeyFromPRF(new Uint8Array(secret));
}
