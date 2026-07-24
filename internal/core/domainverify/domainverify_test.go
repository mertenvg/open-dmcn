package domainverify

import (
	"context"
	"errors"
	"testing"
)

const fp = "3A9FC2B14D5E6F708192A3B4C5D6E7F809010203" // 40 hex chars

// withLookup swaps the package resolver for the duration of a test, mirroring
// the protoMarshal/randReader override pattern used elsewhere in the codebase.
func withLookup(t *testing.T, fn func(ctx context.Context, name string) ([]string, error)) {
	t.Helper()
	old := lookupTXT
	lookupTXT = fn
	t.Cleanup(func() { lookupTXT = old })
}

func TestVerifyMatch(t *testing.T) {
	withLookup(t, func(_ context.Context, name string) ([]string, error) {
		if name != "_dmcn.example.com" {
			t.Fatalf("looked up %q, want _dmcn.example.com", name)
		}
		return []string{"dmcn-verification=v1; fp=" + fp}, nil
	})
	if err := Verify(context.Background(), "example.com", fp); err != nil {
		t.Fatalf("Verify: %v", err)
	}
}

func TestVerifyCaseInsensitive(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		// Record lower-case, query upper-case — must still match.
		return []string{"dmcn-verification=v1; fp=3a9fc2b14d5e6f708192a3b4c5d6e7f809010203"}, nil
	})
	if err := Verify(context.Background(), "example.com", fp); err != nil {
		t.Fatalf("Verify (case-insensitive): %v", err)
	}
}

func TestVerifyMixedRecordsPicksMatch(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return []string{
			"v=spf1 -all",                    // unrelated TXT
			"some other record",              // junk
			"dmcn-verification=v1; fp=" + fp, // the good one
		}, nil
	})
	if err := Verify(context.Background(), "example.com", fp); err != nil {
		t.Fatalf("Verify with mixed records: %v", err)
	}
}

func TestVerifyFingerprintMismatch(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return []string{"dmcn-verification=v1; fp=DEADBEEF"}, nil
	})
	err := Verify(context.Background(), "example.com", fp)
	if !errors.Is(err, ErrFingerprintMismatch) {
		t.Fatalf("got %v, want ErrFingerprintMismatch", err)
	}
}

func TestVerifyNoRecords(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return nil, nil
	})
	err := Verify(context.Background(), "example.com", fp)
	if !errors.Is(err, ErrNoRecord) {
		t.Fatalf("got %v, want ErrNoRecord", err)
	}
}

func TestVerifyMalformedRecordIgnored(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		// v1 scheme but no fp= field → not a match, and no good record present.
		return []string{"dmcn-verification=v1; note=oops"}, nil
	})
	err := Verify(context.Background(), "example.com", fp)
	if !errors.Is(err, ErrFingerprintMismatch) {
		t.Fatalf("got %v, want ErrFingerprintMismatch", err)
	}
}

func TestVerifyLookupErrorPropagated(t *testing.T) {
	sentinel := errors.New("dns boom")
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return nil, sentinel
	})
	err := Verify(context.Background(), "example.com", fp)
	if !errors.Is(err, sentinel) {
		t.Fatalf("got %v, want wrapped %v", err, sentinel)
	}
}

func TestResolveMailboxDeferral(t *testing.T) {
	withLookup(t, func(_ context.Context, name string) ([]string, error) {
		if name != "_dmcn.dmcn.email" {
			t.Fatalf("looked up %q", name)
		}
		return []string{"dmcn-verification=v1; fp=" + fp + "; fleet=dmcnmail.com"}, nil
	})
	rec, err := Resolve(context.Background(), "dmcn.email")
	if err != nil {
		t.Fatalf("Resolve: %v", err)
	}
	if rec.Fingerprint != fp {
		t.Errorf("fp = %q, want %q", rec.Fingerprint, fp)
	}
	if rec.Fleet != "dmcnmail.com" {
		t.Errorf("fleet = %q, want dmcnmail.com", rec.Fleet)
	}
	if len(rec.Seeds) != 0 {
		t.Errorf("seeds = %v, want none", rec.Seeds)
	}
}

func TestResolveFleetSeedsAcrossRecords(t *testing.T) {
	seedA := "/dns4/n1.dmcnmail.com/tcp/4001/p2p/12D3KooWA"
	seedB := "/dns4/n2.dmcnmail.com/tcp/4001/p2p/12D3KooWB"
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return []string{
			"v=spf1 -all", // unrelated, ignored
			"dmcn-verification=v1; fp=" + fp + "; seed=" + seedA,
			"dmcn-verification=v1; seed=" + seedB, // seeds may spread across strings
		}, nil
	})
	rec, err := Resolve(context.Background(), "dmcnmail.com")
	if err != nil {
		t.Fatalf("Resolve: %v", err)
	}
	if rec.Fingerprint != fp {
		t.Errorf("fp = %q, want %q", rec.Fingerprint, fp)
	}
	if rec.Fleet != "" {
		t.Errorf("fleet = %q, want empty (self-hosted fleet)", rec.Fleet)
	}
	if len(rec.Seeds) != 2 || rec.Seeds[0] != seedA || rec.Seeds[1] != seedB {
		t.Errorf("seeds = %v, want [%s %s]", rec.Seeds, seedA, seedB)
	}
}

func TestResolveNoRecord(t *testing.T) {
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return []string{"v=spf1 -all", "unrelated"}, nil // no v1 record
	})
	if _, err := Resolve(context.Background(), "example.com"); !errors.Is(err, ErrNoRecord) {
		t.Fatalf("got %v, want ErrNoRecord", err)
	}
}

func TestResolveLookupErrorPropagated(t *testing.T) {
	sentinel := errors.New("dns boom")
	withLookup(t, func(_ context.Context, _ string) ([]string, error) {
		return nil, sentinel
	})
	if _, err := Resolve(context.Background(), "example.com"); !errors.Is(err, sentinel) {
		t.Fatalf("got %v, want wrapped %v", err, sentinel)
	}
}

func TestDomainOf(t *testing.T) {
	cases := map[string]string{
		"merten@dmcn.me": "dmcn.me",
		"a@b@dmcn.email": "b@dmcn.email", // SplitN keeps everything after first @
		"nolocalpart":    "",
		"":               "",
	}
	for in, want := range cases {
		if got := DomainOf(in); got != want {
			t.Errorf("DomainOf(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestLocalPartOf(t *testing.T) {
	cases := map[string]string{
		"merten@dmcn.me": "merten",
		"a@b@dmcn.email": "a", // SplitN keeps only the part before the first @
		"nolocalpart":    "",
		"":               "",
	}
	for in, want := range cases {
		if got := LocalPartOf(in); got != want {
			t.Errorf("LocalPartOf(%q) = %q, want %q", in, got, want)
		}
	}
}
