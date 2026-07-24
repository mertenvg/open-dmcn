// Client-side verification of a bridged legacy email's authentication
// attestation (gap #6). A bridge runs SPF/DKIM/DMARC at ingest and signs the
// verdict into a BridgeClassificationRecord attachment; the recipient trusts
// that verdict only after confirming, here in the browser, that:
//   1. the record's signature is valid for the key it carries, and
//   2. that key belongs to a directory-registered identity with bridge_capability.
// The web backend never sees plaintext, so this check runs entirely client-side
// over the already-decrypted attachment.
import { decodeBridgeClassification } from './protobuf';
import { verify } from './sign';
import { fromBase64 } from './keys';

export const CLASSIFICATION_CONTENT_TYPE = 'application/x-dmcn-bridge-classification';

export enum BridgeTrustTier {
  Unspecified = 0,
  VerifiedLegacy = 1,
  UnverifiedLegacy = 2,
  Suspicious = 3,
}

// TIER_DOMAIN_DNS mirrors identity.TierDomainDNS (Go) — a domain-anchored
// identity (countersigned by its Domain Authority).
export const TIER_DOMAIN_DNS = 2;

// DirectoryEntry is the subset of an identity lookup this check needs.
export interface DirectoryEntry {
  ed25519_pub: string; // base64 (std)
  bridge_capability?: boolean;
  verified_tier?: number; // cryptographically verified tier (not self-claimed)
  identity_unverifiable?: boolean; // claimed countersignature failed (revoked/invalid)
}

export interface BridgeAttestation {
  verified: boolean; // signature valid AND signer is a registered bridge whose key matches
  trustTier: BridgeTrustTier; // bridge-asserted tier; meaningful only when verified
  domainAnchored: boolean; // signer is countersigned by its domain authority (verified tier >= DomainDNS)
  smtpFrom: string; // original legacy sender, for display
  reason?: string; // why verification failed
}

interface AttachmentLike {
  contentType: string;
  content: Uint8Array;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// verifyBridgeAttestation inspects a decrypted message's attachments. It returns
// null when the message is not a bridged legacy email (no classification record),
// or a verdict describing whether the bridge attestation can be trusted. lookup
// resolves a DMCN address against the public-key directory.
export async function verifyBridgeAttestation(
  attachments: AttachmentLike[],
  lookup: (address: string) => Promise<DirectoryEntry>
): Promise<BridgeAttestation | null> {
  const att = attachments.find((a) => a.contentType === CLASSIFICATION_CONTENT_TYPE);
  if (!att) return null; // not a bridged message

  let record, signableBytes;
  try {
    ({ record, signableBytes } = await decodeBridgeClassification(att.content));
  } catch {
    return { verified: false, domainAnchored: false, trustTier: BridgeTrustTier.Unspecified, smtpFrom: '', reason: 'malformed classification record' };
  }

  const base = { trustTier: record.trustTier as BridgeTrustTier, domainAnchored: false, smtpFrom: record.smtpFrom };

  // 1. The record must be signed by the key it carries.
  let sigOk = false;
  try {
    sigOk = await verify(record.bridgePublicKey, signableBytes, record.bridgeSignature);
  } catch {
    sigOk = false; // malformed key/signature → treat as unverified, never throw
  }
  if (!sigOk) return { ...base, verified: false, reason: 'invalid bridge signature' };

  // 2. Anchor the signer to the directory: it must be a registered bridge whose
  //    published key matches the one in the record. Without this, a valid
  //    self-signature from any key would render as a trusted badge.
  let dir: DirectoryEntry;
  try {
    dir = await lookup(record.bridgeAddress);
  } catch {
    return { ...base, verified: false, reason: 'bridge identity not found in directory' };
  }
  if (!dir.bridge_capability) {
    return { ...base, verified: false, reason: 'signer is not a registered bridge' };
  }
  if (!bytesEqual(fromBase64(dir.ed25519_pub), record.bridgePublicKey)) {
    return { ...base, verified: false, reason: 'bridge key does not match directory' };
  }
  // Revocation: the bridge claimed a domain countersignature that failed to
  // verify (binding tombstoned, countersigner no longer authorized). Always
  // reject — a revoked bridge must never be trusted (gap #9).
  if (dir.identity_unverifiable) {
    return { ...base, verified: false, reason: 'bridge identity revoked or unverifiable' };
  }

  return { ...base, verified: true, domainAnchored: (dir.verified_tier ?? 0) >= TIER_DOMAIN_DNS };
}
