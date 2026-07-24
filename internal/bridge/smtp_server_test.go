package bridge

import (
	"context"
	"testing"

	"github.com/emersion/go-smtp"
	"github.com/mertenvg/logr/v2"
)

func testLogr() logr.Logger { return logr.With(logr.M("test", true)) }

// startTestServer brings up a real SMTP listener wired to the given limits and
// returns its address. The InboundHandler is empty: these tests only exercise
// the connection/rate gates, which run before any message handling.
func startTestServer(t *testing.T, limits *inboundLimits) string {
	t.Helper()
	srv := NewSMTPServer(context.Background(), "127.0.0.1:0", &InboundHandler{}, "bridge.localhost", limits, nil, nil, testLogr())
	if err := srv.Start(); err != nil {
		t.Fatalf("start: %v", err)
	}
	t.Cleanup(func() { srv.Stop() })
	return srv.Addr()
}

// The concurrent-connection cap rejects a connection beyond the limit, end to
// end through go-smtp.
func TestSMTPListenerConnCap(t *testing.T) {
	addr := startTestServer(t, newInboundLimits(100, 100, 1)) // cap = 1

	c1, err := smtp.Dial(addr)
	if err != nil {
		t.Fatalf("dial 1: %v", err)
	}
	defer c1.Close()
	// Force the greeting so c1's session (and its slot) definitely exists.
	if err := c1.Hello("localhost"); err != nil {
		t.Fatalf("hello 1: %v", err)
	}

	c2, err := smtp.Dial(addr)
	if err != nil {
		return // rejected already at connect — acceptable
	}
	defer c2.Close()
	if err := c2.Hello("localhost"); err == nil {
		t.Fatal("second connection should be rejected while the cap is held")
	}
}

// The per-IP rate limit rejects a second message from the same IP at MAIL FROM,
// before any DATA is transmitted.
func TestSMTPListenerRateLimit(t *testing.T) {
	addr := startTestServer(t, newInboundLimits(1 /*per IP per hour*/, 100, 10))

	c1, err := smtp.Dial(addr)
	if err != nil {
		t.Fatalf("dial 1: %v", err)
	}
	defer c1.Close()
	if err := c1.Mail("ext@gmail.com", nil); err != nil {
		t.Fatalf("first MAIL FROM should pass: %v", err)
	}

	c2, err := smtp.Dial(addr)
	if err != nil {
		t.Fatalf("dial 2: %v", err)
	}
	defer c2.Close()
	if err := c2.Mail("ext@gmail.com", nil); err == nil {
		t.Fatal("second MAIL FROM from the same IP should be rate-limited")
	}
}
