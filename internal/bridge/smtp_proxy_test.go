package bridge

import (
	"context"
	"fmt"
	"net"
	"testing"

	"github.com/emersion/go-smtp"
	"github.com/pires/go-proxyproto"
)

// dialWithProxy opens a raw connection, sends a PROXY v1 header declaring
// clientIP as the real source, then wraps it in an SMTP client.
func dialWithProxy(t *testing.T, addr, clientIP string) *smtp.Client {
	t.Helper()
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	if _, err := fmt.Fprintf(conn, "PROXY TCP4 %s 127.0.0.1 12345 2525\r\n", clientIP); err != nil {
		t.Fatalf("write proxy header: %v", err)
	}
	return smtp.NewClient(conn)
}

// With PROXY protocol from a trusted proxy, per-IP rate limiting keys on the
// PROXY-declared client IP — not the shared proxy address. Two messages from the
// same declared IP trip a limit of 1; a different declared IP is unaffected.
func TestSMTPProxyProtocolSourceIP(t *testing.T) {
	policy, err := proxyproto.ConnLaxWhiteListPolicy([]string{"127.0.0.1/32", "::1/128"})
	if err != nil {
		t.Fatalf("policy: %v", err)
	}
	limits := newInboundLimits(1 /*per IP per hour*/, 100, 10)
	srv := NewSMTPServer(context.Background(), "127.0.0.1:0", &InboundHandler{}, "bridge.localhost", limits, nil, policy, testLogr())
	if err := srv.Start(); err != nil {
		t.Fatalf("start: %v", err)
	}
	t.Cleanup(func() { srv.Stop() })
	addr := srv.Addr()

	c1 := dialWithProxy(t, addr, "11.11.11.11")
	defer c1.Close()
	if err := c1.Mail("a@gmail.com", nil); err != nil {
		t.Fatalf("first from 11.11.11.11 should pass: %v", err)
	}

	c2 := dialWithProxy(t, addr, "22.22.22.22")
	defer c2.Close()
	if err := c2.Mail("b@gmail.com", nil); err != nil {
		t.Fatalf("first from 22.22.22.22 (distinct IP) should pass: %v", err)
	}

	c3 := dialWithProxy(t, addr, "11.11.11.11")
	defer c3.Close()
	if err := c3.Mail("c@gmail.com", nil); err == nil {
		t.Fatal("second from 11.11.11.11 should be rate-limited (limiter must key on the declared IP)")
	}
}
