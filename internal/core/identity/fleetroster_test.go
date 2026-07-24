package identity

import (
	"testing"
	"time"
)

func TestFleetRosterSignVerifyRoundTrip(t *testing.T) {
	root := mustKP(t)
	r, err := NewFleetRoster("dmcnmail.com", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	r.Nodes = []FleetNode{
		{PeerID: "12D3KooWA", Multiaddrs: []string{"/dns4/n1.dmcnmail.com/tcp/4001/p2p/12D3KooWA"}, Roles: []string{"node"}},
		{PeerID: "12D3KooWB", Multiaddrs: []string{"/dns4/n2.dmcnmail.com/tcp/4001/p2p/12D3KooWB"}, Roles: []string{"node", "bridge"}},
	}
	if err := r.Sign(root); err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if err := r.Verify(root.Ed25519Public); err != nil {
		t.Fatalf("Verify: %v", err)
	}

	// Proto round-trip preserves the roster and signature.
	data, err := protoMarshal(r.ToProto())
	if err != nil {
		t.Fatalf("protoMarshal: %v", err)
	}
	got, err := FleetRosterFromProtoBytes(data)
	if err != nil {
		t.Fatal(err)
	}
	if err := got.Verify(root.Ed25519Public); err != nil {
		t.Fatalf("Verify after round-trip: %v", err)
	}
	if got.FleetDomain != "dmcnmail.com" || len(got.Nodes) != 2 ||
		got.Nodes[1].PeerID != "12D3KooWB" || len(got.Nodes[1].Roles) != 2 {
		t.Fatalf("round-trip mismatch: %+v", got)
	}
}

func TestFleetRosterTamperBreaksSignature(t *testing.T) {
	root := mustKP(t)
	r, err := NewFleetRoster("dmcnmail.com", time.Now())
	if err != nil {
		t.Fatal(err)
	}
	r.Nodes = []FleetNode{{PeerID: "12D3KooWA", Multiaddrs: []string{"/ip4/10.0.0.1/tcp/4001/p2p/12D3KooWA"}}}
	if err := r.Sign(root); err != nil {
		t.Fatal(err)
	}
	// Injecting a node after signing must break the signature — an untrusted carrier
	// can withhold the roster but never forge its membership.
	r.Nodes = append(r.Nodes, FleetNode{PeerID: "12D3KooWEvil", Multiaddrs: []string{"/ip4/6.6.6.6/tcp/4001/p2p/12D3KooWEvil"}})
	if err := r.Verify(root.Ed25519Public); err == nil {
		t.Fatal("expected tampered roster to fail Verify")
	}

	// A different key cannot verify a roster it did not sign.
	other := mustKP(t)
	r2, _ := NewFleetRoster("dmcnmail.com", time.Now())
	_ = r2.Sign(root)
	if err := r2.Verify(other.Ed25519Public); err == nil {
		t.Fatal("expected verify against a foreign root key to fail")
	}
}
