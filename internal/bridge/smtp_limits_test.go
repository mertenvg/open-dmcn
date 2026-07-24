package bridge

import "testing"

func TestInboundLimitsConnCap(t *testing.T) {
	l := newInboundLimits(100, 100, 2)

	r1, ok := l.acquireConn()
	if !ok {
		t.Fatal("first connection should be allowed")
	}
	if _, ok := l.acquireConn(); !ok {
		t.Fatal("second connection should be allowed")
	}
	if _, ok := l.acquireConn(); ok {
		t.Fatal("third connection should be rejected at the cap")
	}

	// Releasing one slot frees capacity for a new connection.
	r1()
	if _, ok := l.acquireConn(); !ok {
		t.Fatal("a slot should be free after release")
	}

	// Release is idempotent — calling it again must not over-credit the pool.
	r1()
	if _, ok := l.acquireConn(); ok {
		t.Fatal("double release must not free an extra slot")
	}
}

func TestInboundLimitsPerIP(t *testing.T) {
	l := newInboundLimits(2 /*per IP*/, 1000 /*per sender, high*/, 10)
	// Same IP, distinct senders so only the per-IP limit can trip.
	if !l.allowMessage("1.1.1.1", "a@x.com") {
		t.Fatal("1st from IP should pass")
	}
	if !l.allowMessage("1.1.1.1", "b@x.com") {
		t.Fatal("2nd from IP should pass")
	}
	if l.allowMessage("1.1.1.1", "c@x.com") {
		t.Fatal("3rd from same IP should be rate-limited")
	}
	// A different IP is unaffected.
	if !l.allowMessage("2.2.2.2", "d@x.com") {
		t.Fatal("a different IP should not be limited")
	}
}

func TestInboundLimitsPerSender(t *testing.T) {
	l := newInboundLimits(1000 /*per IP, high*/, 2 /*per sender*/, 10)
	// Same sender, distinct IPs so only the per-sender limit can trip.
	if !l.allowMessage("1.0.0.1", "spammer@x.com") {
		t.Fatal("1st from sender should pass")
	}
	if !l.allowMessage("1.0.0.2", "spammer@x.com") {
		t.Fatal("2nd from sender should pass")
	}
	if l.allowMessage("1.0.0.3", "spammer@x.com") {
		t.Fatal("3rd from same sender should be rate-limited")
	}
}

func TestInboundLimitsSenderNormalization(t *testing.T) {
	l := newInboundLimits(1000, 1, 10)
	if !l.allowMessage("1.0.0.1", "<Alice@E.com>") {
		t.Fatal("1st should pass")
	}
	// Same sender after case-folding + angle-bracket trimming → limited.
	if l.allowMessage("1.0.0.2", "alice@e.com") {
		t.Fatal("normalized-equal sender should be rate-limited")
	}
}

func TestInboundLimitsEmptyIdentifiersSkip(t *testing.T) {
	l := newInboundLimits(1, 1, 10)
	// Empty IP and empty sender skip their respective checks; should never block.
	for i := 0; i < 5; i++ {
		if !l.allowMessage("", "") {
			t.Fatalf("empty identifiers must not be rate-limited (iter %d)", i)
		}
	}
}

func TestInboundLimitsDefaults(t *testing.T) {
	l := newInboundLimits(0, 0, 0)
	if l.maxConns != defaultInboundMaxConns {
		t.Fatalf("maxConns = %d, want default %d", l.maxConns, defaultInboundMaxConns)
	}
	if l.ipRate == nil || l.senderRate == nil {
		t.Fatal("rate limiters must be initialized")
	}
}

func TestIPKey(t *testing.T) {
	cases := map[string]string{
		"1.2.3.4:5678": "1.2.3.4",
		"[::1]:25":     "::1",
		"1.2.3.4":      "1.2.3.4",
		"garbage":      "garbage",
	}
	for in, want := range cases {
		if got := ipKey(in); got != want {
			t.Errorf("ipKey(%q) = %q, want %q", in, got, want)
		}
	}
}
