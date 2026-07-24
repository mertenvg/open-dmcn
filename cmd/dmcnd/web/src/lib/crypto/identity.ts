// Identity-record self-signing. The self-signature is computed over a
// domain-separation context PREFIX followed by the record's signable bytes —
// it must match Go's signCtx(ctxIdentitySelf, …) in
// internal/core/identity/identity.go, where
//   ctxIdentitySelf = "dmcn-identity-self-v1\x00"
// Signing the bare signable bytes (without this prefix) produces a signature the
// Go directory rejects with "identity record signature verification failed".
import { sign } from './sign';

/** "dmcn-identity-self-v1" + a trailing NUL, as raw bytes. */
export const ID_SELF_CTX: Uint8Array = (() => {
  const tag = new TextEncoder().encode('dmcn-identity-self-v1');
  const out = new Uint8Array(tag.length + 1); // trailing NUL
  out.set(tag, 0);
  return out;
})();

/**
 * Produce an identity record's self-signature: Ed25519 over
 * ID_SELF_CTX || signableBytes, signed with the 32-byte Ed25519 seed.
 */
export async function signSelfSignature(seed: Uint8Array, signableBytes: Uint8Array): Promise<Uint8Array> {
  const buf = new Uint8Array(ID_SELF_CTX.length + signableBytes.length);
  buf.set(ID_SELF_CTX, 0);
  buf.set(signableBytes, ID_SELF_CTX.length);
  return sign(seed, buf);
}
