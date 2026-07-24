package relay

import (
	"bytes"
	"context"
	"testing"
)

func TestAccountStoreRoundTrip(t *testing.T) {
	ctx := context.Background()
	d := openMailboxDS(t, t.TempDir())
	defer d.Close()

	as, err := NewAccountStore(d, []byte("node-secret-32-bytes-or-whatever"))
	if err != nil {
		t.Fatalf("NewAccountStore: %v", err)
	}

	addrs := []string{"alice@d.test", "bob@d.test", "carol@d.test"}
	for _, a := range addrs {
		if err := as.Record(ctx, a); err != nil {
			t.Fatalf("record %s: %v", a, err)
		}
	}
	// Idempotent.
	if err := as.Record(ctx, "alice@d.test"); err != nil {
		t.Fatal(err)
	}

	got, err := as.Accounts(ctx)
	if err != nil {
		t.Fatalf("accounts: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("got %d accounts, want 3: %v", len(got), got)
	}
	set := map[string]bool{}
	for _, a := range got {
		set[a] = true
	}
	for _, a := range addrs {
		if !set[a] {
			t.Errorf("missing account %s", a)
		}
	}

	has, _ := as.Has(ctx, "bob@d.test")
	if !has {
		t.Error("Has(bob) = false, want true")
	}
	if err := as.Remove(ctx, "bob@d.test"); err != nil {
		t.Fatal(err)
	}
	if has, _ := as.Has(ctx, "bob@d.test"); has {
		t.Error("Has(bob) = true after remove")
	}
}

// TestAccountStoreSealedAtRest verifies the address is not stored in plaintext.
func TestAccountStoreSealedAtRest(t *testing.T) {
	ctx := context.Background()
	d := openMailboxDS(t, t.TempDir())
	defer d.Close()
	as, err := NewAccountStore(d, []byte("another-node-secret-value-here!!"))
	if err != nil {
		t.Fatal(err)
	}
	const addr = "secret@d.test"
	if err := as.Record(ctx, addr); err != nil {
		t.Fatal(err)
	}
	raw, err := d.Get(ctx, accountKey(addr))
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(raw, []byte(addr)) {
		t.Fatal("address stored in plaintext — not sealed at rest")
	}

	// A store with a different secret cannot decrypt.
	other, _ := NewAccountStore(d, []byte("a-totally-different-node-secret!!"))
	got, _ := other.Accounts(ctx)
	if len(got) != 0 {
		t.Fatalf("a different key must not decrypt entries, got %v", got)
	}
}
