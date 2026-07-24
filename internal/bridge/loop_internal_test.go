package bridge

import "testing"

func TestReceivedHopCount(t *testing.T) {
	raw := []byte("Received: a\r\nReceived: b\r\nReceived: c\r\nFrom: x@e.com\r\n\r\nbody")
	h, err := parseHeaders(raw)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got := receivedHopCount(h); got != 3 {
		t.Fatalf("hop count = %d, want 3", got)
	}
}

func TestIsAutoSubmitted(t *testing.T) {
	tests := []struct {
		name string
		raw  string
		want bool
	}{
		{"none", "From: x@e.com\r\n\r\nb", false},
		{"auto-submitted no", "Auto-Submitted: no\r\nFrom: x@e.com\r\n\r\nb", false},
		{"auto-generated", "Auto-Submitted: auto-generated\r\nFrom: x@e.com\r\n\r\nb", true},
		{"auto-replied", "Auto-Submitted: auto-replied\r\nFrom: x@e.com\r\n\r\nb", true},
		{"precedence bulk", "Precedence: bulk\r\nFrom: x@e.com\r\n\r\nb", true},
		{"precedence normal", "Precedence: first-class\r\nFrom: x@e.com\r\n\r\nb", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, err := parseHeaders([]byte(tt.raw))
			if err != nil {
				t.Fatalf("parse: %v", err)
			}
			if got := isAutoSubmitted(h); got != tt.want {
				t.Fatalf("isAutoSubmitted = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestIsNullSender(t *testing.T) {
	for _, s := range []string{"", "<>", "  <>  ", "  "} {
		if !isNullSender(s) {
			t.Errorf("isNullSender(%q) = false, want true", s)
		}
	}
	for _, s := range []string{"a@b.com", "<a@b.com>"} {
		if isNullSender(s) {
			t.Errorf("isNullSender(%q) = true, want false", s)
		}
	}
}
