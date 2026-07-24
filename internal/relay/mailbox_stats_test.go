package relay

import (
	"context"
	"testing"
	"time"
)

func TestMailboxStats(t *testing.T) {
	ctx := context.Background()
	d := openMailboxDS(t, t.TempDir())
	defer d.Close()
	mbox := NewMailboxStore(d)

	rxPub, _, rxHex := mailboxTestRecipient(t)

	if msgs, bytes, err := mbox.Stats(ctx); err != nil || msgs != 0 || bytes != 0 {
		t.Fatalf("empty Stats = (%d,%d,%v), want (0,0,nil)", msgs, bytes, err)
	}

	base := time.Unix(1_700_000_000, 0)
	var hashes [][32]byte
	for i := 0; i < 3; i++ {
		env, hash := makeSplitEnvelope(t, rxPub, "msg", "some body content here")
		if err := mbox.Store(ctx, rxHex, hash, env, base.Add(time.Duration(i)*time.Millisecond)); err != nil {
			t.Fatalf("store %d: %v", i, err)
		}
		hashes = append(hashes, hash)
	}

	msgs, bytes, err := mbox.Stats(ctx)
	if err != nil {
		t.Fatalf("Stats: %v", err)
	}
	if msgs != 3 {
		t.Fatalf("messages = %d, want 3", msgs)
	}
	if bytes == 0 {
		t.Fatal("bytes = 0, want > 0")
	}

	// Deleting reduces the count.
	if err := mbox.Delete(ctx, rxHex, hashes[0]); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if msgs, _, err := mbox.Stats(ctx); err != nil || msgs != 2 {
		t.Fatalf("after delete messages = %d (err %v), want 2", msgs, err)
	}
}
