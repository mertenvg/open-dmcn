package identity

import (
	"bytes"
	"crypto/ed25519"
	"errors"
	"fmt"
	"strings"
	"time"
)

// addressDomain returns the domain portion of a local@domain address (mirrors
// domainverify.DomainOf without importing that package).
func addressDomain(address string) string {
	parts := strings.SplitN(address, "@", 2)
	if len(parts) != 2 {
		return ""
	}
	return parts[1]
}

// VerifyManagedRecord verifies an IdentityRecord's self-signature and its address/routing
// credentials against a SUPPLIED DomainAuthorityRecord (+ optional blocklist and removal
// tombstone), returning the effective verification tier. It is PURE — no network I/O — so it
// verifies a fleet-served record from a fleet-served DAR without any DHT lookup, and survives
// the DHT's removal.
//
// The CALLER is responsible for the two anchors this function cannot check locally:
//   - the DAR is anchored to DNS (its Fingerprint() == the domain's _dmcn TXT), and
//   - any fleet deferral is confirmed (DNS fleet= == dar.FleetDomain).
//
// It mirrors the reader-side trust rules of registry.VerifyManagedIdentity: an uncredentialed
// record returns its self-claimed tier; a credentialed record must match + chain to the DAR (and
// not be tombstoned) to reach TierDomainDNS.
func VerifyManagedRecord(rec *IdentityRecord, dar *DomainAuthorityRecord, blocks *CredentialBlockList, removal *AddressRemovalRecord, now time.Time) (VerificationTier, error) {
	if rec == nil || dar == nil {
		return TierUnverified, errors.New("identity: nil record or DAR")
	}
	if err := rec.Verify(); err != nil {
		return TierUnverified, fmt.Errorf("identity: self-signature: %w", err)
	}
	domain := addressDomain(rec.Address)
	if domain == "" || !strings.EqualFold(domain, dar.Domain) {
		return TierUnverified, fmt.Errorf("identity: record domain %q != DAR domain %q", domain, dar.Domain)
	}

	// Operator routing credential (RelayHints is operator-owned, excluded from the self-signature).
	if rec.HasRoutingCredential() {
		rc := rec.RoutingCredential
		if rc.Domain != dar.Domain || rc.Address != rec.Address || !rc.HasRole(RoleRouting) || !bytes.Equal(rc.Subject, rec.Ed25519Public) {
			return TierUnverified, errors.New("identity: routing credential does not match record")
		}
		if !relayHintsEqual(rec.RelayHints, rc.RelayHints) {
			return TierUnverified, errors.New("identity: relay hints do not match routing credential")
		}
		if err := VerifyCredential(rc, dar, blocks, now); err != nil {
			return TierUnverified, fmt.Errorf("identity: routing credential: %w", err)
		}
	}

	// Domain address credential (the domain's attestation of the address↔key binding).
	if !rec.HasAddressCredential() {
		return rec.VerificationTier, nil
	}
	cred := rec.AddressCredential
	if cred.Domain != dar.Domain || cred.Address != rec.Address || !cred.HasRole(RoleAddress) || !bytes.Equal(cred.Subject, rec.Ed25519Public) {
		return TierUnverified, errors.New("identity: address credential does not match record")
	}
	if err := VerifyCredential(cred, dar, blocks, now); err != nil {
		return TierUnverified, fmt.Errorf("identity: address credential: %w", err)
	}
	// A root-signed removal tombstone still invalidates the binding.
	if removal != nil && RemovalIsRootSigned(dar, removal) {
		if _, removed := removal.Removed(rec.Ed25519Public); removed {
			return TierUnverified, errors.New("identity: binding removed by domain")
		}
	}
	return TierDomainDNS, nil
}

// relayHintsEqual reports whether two ordered relay-hint lists are identical.
func relayHintsEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// RemovalIsRootSigned reports whether an AddressRemovalRecord is signed by a root key the DAR
// vouches for (the current key effective at the removal's timestamp, or any key in the timeline).
func RemovalIsRootSigned(dar *DomainAuthorityRecord, rm *AddressRemovalRecord) bool {
	if pub, ok := dar.RootKeyAt(rm.CreatedAt); ok && rm.Verify(pub) == nil {
		return true
	}
	for _, pub := range darRootKeys(dar) {
		if rm.Verify(pub) == nil {
			return true
		}
	}
	return false
}

// BlocklistIsRootSigned reports whether a CredentialBlockList is signed by a root key the DAR
// vouches for. A reader MUST check this before honoring a blocklist — otherwise an untrusted
// carrier (a hostile fleet) could censor a valid credential with a forged blocklist.
func BlocklistIsRootSigned(dar *DomainAuthorityRecord, bl *CredentialBlockList) bool {
	if bl == nil {
		return false
	}
	for _, pub := range darRootKeys(dar) {
		if bl.Verify(pub) == nil {
			return true
		}
	}
	return false
}

func darRootKeys(dar *DomainAuthorityRecord) []ed25519.PublicKey {
	keys := make([]ed25519.PublicKey, 0, len(dar.SupersededKeys)+1)
	keys = append(keys, dar.AuthorityEd25519)
	for _, k := range dar.SupersededKeys {
		keys = append(keys, k.Ed25519Public)
	}
	return keys
}
