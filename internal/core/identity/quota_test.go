package identity

import (
	"testing"
	"time"
)

// TestQuotaCredentialSignRoundTrip covers building, signing, reading, and re-parsing a
// RoleQuota credential (the artifact the web signs on payment).
func TestQuotaCredentialSignRoundTrip(t *testing.T) {
	web := mustKP(t)
	owner := mustKP(t)
	now := time.Now().Truncate(time.Second)

	qc := NewQuotaCredential(owner.Ed25519Public, "owner@alice.com", 50<<30, now, time.Time{})
	if err := qc.Sign(web); err != nil {
		t.Fatal(err)
	}
	if err := qc.VerifySignature(); err != nil {
		t.Fatalf("VerifySignature = %v, want nil", err)
	}
	if QuotaBytesOf(qc) != 50<<30 || !qc.HasRole(RoleQuota) {
		t.Fatalf("quota=%d role=%v", QuotaBytesOf(qc), qc.Roles)
	}

	raw, err := MarshalCredential(qc)
	if err != nil {
		t.Fatal(err)
	}
	got, err := CredentialFromProtoBytes(raw)
	if err != nil {
		t.Fatal(err)
	}
	if QuotaBytesOf(got) != 50<<30 || got.Address != "owner@alice.com" || string(got.Subject) != string(owner.Ed25519Public) {
		t.Fatalf("round-trip mismatch: %+v", got)
	}

	// Tampering with the quota after signing breaks the signature.
	got.Attributes[QuotaAttr] = "999999999999"
	if err := got.VerifySignature(); err == nil {
		t.Fatal("a tampered quota credential must fail signature verification")
	}
}

// TestQuotaGrantIsOperatorDelegated: the 'quota' grant lives on the FLEET axis — the operator
// can air-gap-sign a fleet credential carrying it (verified against the operator pubkey), so
// quota-granting authority is operator-delegated, NOT domain-owner controlled.
func TestQuotaGrantIsOperatorDelegated(t *testing.T) {
	operator := mustKP(t)
	web := mustKP(t)
	now := time.Now().Truncate(time.Second)

	// Operator delegates the 'quota' grant to the web's fleet credential (offline, once).
	fleetCred := &Credential{
		Version: 1, Subject: web.Ed25519Public,
		Roles: []string{RoleClient}, Grants: []string{GrantRouting, GrantQuota}, IssuedAt: now,
	}
	if err := fleetCred.Sign(operator); err != nil {
		t.Fatal(err)
	}
	if err := VerifyFleetCredential(fleetCred, operator.Ed25519Public, now); err != nil {
		t.Fatalf("operator-signed fleet credential with the quota grant should verify: %v", err)
	}
	if !fleetCred.HasGrant(GrantQuota) {
		t.Fatal("fleet credential should carry the quota grant")
	}

	// A fleet credential NOT signed by the operator root is rejected (only the operator may
	// delegate the quota grant).
	rogue := mustKP(t)
	rogueCred := &Credential{
		Version: 1, Subject: web.Ed25519Public,
		Roles: []string{RoleClient}, Grants: []string{GrantQuota}, IssuedAt: now,
	}
	if err := rogueCred.Sign(rogue); err != nil {
		t.Fatal(err)
	}
	if err := VerifyFleetCredential(rogueCred, operator.Ed25519Public, now); err == nil {
		t.Fatal("a quota grant not signed by the operator root must be rejected")
	}
}
