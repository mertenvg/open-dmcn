package peerpolicy

import (
	"testing"

	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/peer"
)

// newPeerID deterministically derives a peer ID from a seed byte so tests need
// no randomness.
func newPeerID(t *testing.T, seed byte) peer.ID {
	t.Helper()
	b := make([]byte, ed25519SeedLen)
	for i := range b {
		b[i] = seed
	}
	priv, _, err := crypto.GenerateEd25519Key(deterministicReader(b))
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	id, err := peer.IDFromPrivateKey(priv)
	if err != nil {
		t.Fatalf("derive id: %v", err)
	}
	return id
}

const ed25519SeedLen = 32

// deterministicReader yields a fixed byte stream so key generation is stable.
type deterministicReader []byte

func (d deterministicReader) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = d[i%len(d)]
	}
	return len(p), nil
}

func TestAllowAll(t *testing.T) {
	var p Policy = AllowAll{}
	if !p.Allow(PeerContext{ID: newPeerID(t, 1)}) {
		t.Error("AllowAll should allow any peer")
	}
	if p.Name() != "allow-all" {
		t.Errorf("Name = %q, want allow-all", p.Name())
	}
}

func TestAllowNone(t *testing.T) {
	var p Policy = AllowNone{}
	if p.Allow(PeerContext{ID: newPeerID(t, 1)}) {
		t.Error("AllowNone should allow no peer")
	}
	if p.Name() != "allow-none" {
		t.Errorf("Name = %q, want allow-none", p.Name())
	}
}

func TestPeerAllowList(t *testing.T) {
	a := newPeerID(t, 1)
	b := newPeerID(t, 2)
	p := NewPeerAllowList([]peer.ID{a})

	if !p.Allow(PeerContext{ID: a}) {
		t.Error("listed peer should be allowed")
	}
	if p.Allow(PeerContext{ID: b}) {
		t.Error("unlisted peer should be denied")
	}
	if NewPeerAllowList(nil).Allow(PeerContext{ID: a}) {
		t.Error("empty allowlist should deny all")
	}
	if p.Name() != "peer-allowlist" {
		t.Errorf("Name = %q", p.Name())
	}
}
