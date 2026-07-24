package identity

import (
	"testing"
	"time"
)

// TestAccessCredentialSignRoundTrip covers building, signing, reading, and re-parsing a
// RoleAccess assertion (the artifact the b2c signs on payment), including its validity window.
func TestAccessCredentialSignRoundTrip(t *testing.T) {
	b2c := mustKP(t)
	owner := mustKP(t)
	now := time.Now().Truncate(time.Second)
	openUntil := now.Add(30 * 24 * time.Hour)

	ac := NewAccessCredential(owner.Ed25519Public, "owner@alice.com", AccessOpen, now, openUntil, now)
	if err := ac.Sign(b2c); err != nil {
		t.Fatal(err)
	}
	if err := ac.VerifySignature(); err != nil {
		t.Fatalf("VerifySignature = %v, want nil", err)
	}
	if AccessModeOf(ac) != AccessOpen || !ac.HasRole(RoleAccess) {
		t.Fatalf("mode=%q role=%v", AccessModeOf(ac), ac.Roles)
	}

	raw, err := MarshalCredential(ac)
	if err != nil {
		t.Fatal(err)
	}
	got, err := CredentialFromProtoBytes(raw)
	if err != nil {
		t.Fatal(err)
	}
	if AccessModeOf(got) != AccessOpen || got.Address != "owner@alice.com" ||
		string(got.Subject) != string(owner.Ed25519Public) ||
		!got.EffectiveFrom.Equal(now) || !got.NotAfter.Equal(openUntil) {
		t.Fatalf("round-trip mismatch: mode=%q addr=%q eff=%v not=%v", AccessModeOf(got), got.Address, got.EffectiveFrom, got.NotAfter)
	}

	// The validity window is covered by the signature (EffectiveFrom is signable).
	got.EffectiveFrom = now.Add(-time.Hour)
	if err := got.VerifySignature(); err == nil {
		t.Fatal("tampering with EffectiveFrom must break the signature")
	}
}

// TestDeriveAccessMode walks the open→suspended→closed timeline plus the default-open and
// open-wins-overlap cases.
func TestDeriveAccessMode(t *testing.T) {
	owner := mustKP(t)
	t0 := time.Now().Truncate(time.Second)
	periodEnd := t0.Add(30 * 24 * time.Hour)
	graceEnd := periodEnd.Add(30 * 24 * time.Hour)

	openC := NewAccessCredential(owner.Ed25519Public, "o@a.com", AccessOpen, t0, periodEnd, t0)
	suspC := NewAccessCredential(owner.Ed25519Public, "o@a.com", AccessSuspended, periodEnd, graceEnd, t0)

	cases := []struct {
		name       string
		open, susp *Credential
		now        time.Time
		want       string
	}{
		{"neither installed = open (default)", nil, nil, t0.Add(time.Hour), AccessOpen},
		{"during paid period = open", openC, suspC, t0.Add(time.Hour), AccessOpen},
		{"boundary open_until = suspended", openC, suspC, periodEnd, AccessSuspended},
		{"during grace = suspended", openC, suspC, periodEnd.Add(time.Hour), AccessSuspended},
		{"boundary grace_end = closed", openC, suspC, graceEnd, AccessClosed},
		{"after grace = closed", openC, suspC, graceEnd.Add(time.Hour), AccessClosed},
		{"only open, expired = closed", openC, nil, periodEnd.Add(time.Hour), AccessClosed},
		{"only suspended, in effect = suspended", nil, suspC, periodEnd.Add(time.Hour), AccessSuspended},
	}
	for _, c := range cases {
		if got := DeriveAccessMode(c.open, c.susp, c.now); got != c.want {
			t.Errorf("%s: DeriveAccessMode = %q, want %q", c.name, got, c.want)
		}
	}

	// Open wins an overlap: a suspended assertion effective from t0 is masked while the open
	// assertion is still in effect.
	suspOverlap := NewAccessCredential(owner.Ed25519Public, "o@a.com", AccessSuspended, t0, graceEnd, t0)
	if got := DeriveAccessMode(openC, suspOverlap, t0.Add(time.Hour)); got != AccessOpen {
		t.Fatalf("overlap: got %q, want open (open wins)", got)
	}
}

// TestCredentialEffectiveFromVerifyChain: a forward-dated credential is rejected by verifyChain
// before its EffectiveFrom and accepted once effective (the general not-before behavior; the
// access install path deliberately uses VerifySignature only, so it is unaffected).
func TestCredentialEffectiveFromVerifyChain(t *testing.T) {
	const domain = "example.com"
	base := time.Now().Add(-time.Hour).Truncate(time.Second)
	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, base)
	dar.AuthorityEffectiveFrom = base
	if err := dar.Sign(root); err != nil {
		t.Fatal(err)
	}

	future := time.Now().Add(24 * time.Hour).Truncate(time.Second)
	c := &Credential{Version: 1, Subject: mustKP(t).Ed25519Public, Domain: domain,
		Roles: []string{RoleNode}, IssuedAt: base, EffectiveFrom: future}
	if err := c.Sign(root); err != nil {
		t.Fatal(err)
	}
	if err := VerifyCredential(c, dar, nil, time.Now()); err == nil {
		t.Fatal("a not-yet-effective credential must be rejected by verifyChain")
	}
	if err := VerifyCredential(c, dar, nil, future.Add(time.Hour)); err != nil {
		t.Fatalf("once effective the credential must verify: %v", err)
	}
}
