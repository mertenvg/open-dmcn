package identity

import "testing"

func TestIdentityRequireOnionSignedAndRoundTrips(t *testing.T) {
	kp, err := GenerateIdentityKeyPair()
	if err != nil {
		t.Fatal(err)
	}
	rec, err := NewIdentityRecord("alice@dmcn.me", kp)
	if err != nil {
		t.Fatal(err)
	}
	rec.RequireOnion = true
	if err := rec.Sign(kp); err != nil {
		t.Fatalf("sign: %v", err)
	}
	if err := rec.Verify(); err != nil {
		t.Fatalf("verify: %v", err)
	}

	b, err := protoMarshal(rec.ToProto())
	if err != nil {
		t.Fatal(err)
	}
	got, err := IdentityRecordFromProtoBytes(b)
	if err != nil {
		t.Fatal(err)
	}
	if !got.RequireOnion {
		t.Fatal("RequireOnion lost in round-trip")
	}
	if err := got.Verify(); err != nil {
		t.Fatalf("verify after round-trip: %v", err)
	}

	// RequireOnion is covered by the self-signature: flipping it must invalidate.
	got.RequireOnion = false
	if err := got.Verify(); err == nil {
		t.Fatal("flipping RequireOnion must invalidate the self-signature")
	}
}

func TestDARRequiresOnion(t *testing.T) {
	if !(&DomainAuthorityRecord{PolicyFlags: PolicyRequireOnion}).RequiresOnion() {
		t.Fatal("expected RequiresOnion true")
	}
	if (&DomainAuthorityRecord{PolicyFlags: PolicyRequireCountersign}).RequiresOnion() {
		t.Fatal("expected RequiresOnion false for a countersign-only policy")
	}
}
