package mailfilter

import "testing"

func TestPermits(t *testing.T) {
	cases := []struct {
		name      string
		list      *List
		sender    string
		senderKey string
		verified  bool
		want      bool
	}{
		{"nil list permits", nil, "x@evil.com", "", false, true},
		{"empty deny permits", &List{Mode: ModeDeny}, "x@evil.com", "", false, true},
		{"deny domain blocks", &List{Mode: ModeDeny, Domains: []string{"evil.com"}}, "x@evil.com", "", false, false},
		{"deny domain case-insensitive", &List{Mode: ModeDeny, Domains: []string{"Evil.com"}}, "x@EVIL.com", "", false, false},
		{"deny other domain allowed", &List{Mode: ModeDeny, Domains: []string{"evil.com"}}, "x@good.com", "", false, true},
		{"deny specific sender blocks", &List{Mode: ModeDeny, Senders: []string{"spam@good.com"}}, "spam@good.com", "", false, false},
		{"deny specific sender, other ok", &List{Mode: ModeDeny, Senders: []string{"spam@good.com"}}, "ok@good.com", "", false, true},
		{"allow default-deny", &List{Mode: ModeAllow}, "x@good.com", "", false, false},
		{"allow listed domain", &List{Mode: ModeAllow, Domains: []string{"good.com"}}, "x@good.com", "", false, true},
		{"allow listed sender", &List{Mode: ModeAllow, Senders: []string{"vip@good.com"}}, "vip@good.com", "", false, true},
		{"allow unlisted denied", &List{Mode: ModeAllow, Domains: []string{"good.com"}}, "x@other.com", "", false, false},
		{"allow verified admits verified", &List{Mode: ModeAllow, AllowVerified: true}, "x@dns.com", "", true, true},
		{"allow verified rejects unverified", &List{Mode: ModeAllow, AllowVerified: true}, "x@dns.com", "", false, false},

		// Key-bound personal blocklist (§14.3.1): unconditional, mode-independent.
		{"key block drops in deny mode", &List{Mode: ModeDeny, SenderKeys: []string{"ab12"}}, "x@good.com", "ab12", false, false},
		{"key block case-insensitive", &List{Mode: ModeDeny, SenderKeys: []string{"AB12"}}, "x@good.com", "ab12", false, false},
		{"key block drops even when address changes", &List{Mode: ModeDeny, SenderKeys: []string{"ab12"}}, "renamed@good.com", "ab12", false, false},
		{"key block overrides allow-verified admission", &List{Mode: ModeAllow, AllowVerified: true, SenderKeys: []string{"ab12"}}, "x@dns.com", "ab12", true, false},
		{"key block overrides allow-listed sender", &List{Mode: ModeAllow, Senders: []string{"vip@good.com"}, SenderKeys: []string{"ab12"}}, "vip@good.com", "ab12", false, false},
		{"unlisted key passes", &List{Mode: ModeDeny, SenderKeys: []string{"ab12"}}, "x@good.com", "cd34", false, true},
		{"empty key never matches", &List{Mode: ModeDeny, SenderKeys: []string{"ab12"}}, "x@good.com", "", false, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := c.list.Permits(c.sender, c.senderKey, c.verified); got != c.want {
				t.Fatalf("Permits(%q, %q, %v) = %v, want %v", c.sender, c.senderKey, c.verified, got, c.want)
			}
		})
	}
}

// TestUnmarshalBackCompat verifies an old sealed blob (no sender_keys field) still
// decodes and behaves identically.
func TestUnmarshalBackCompat(t *testing.T) {
	old := []byte(`{"mode":"deny","domains":["evil.com"],"senders":["spam@good.com"]}`)
	l, err := Unmarshal(old)
	if err != nil {
		t.Fatal(err)
	}
	if l.SenderKeys != nil {
		t.Fatalf("expected nil SenderKeys, got %v", l.SenderKeys)
	}
	if !l.Permits("ok@good.com", "anykey", false) {
		t.Fatal("legacy list should permit an unlisted sender")
	}
	if l.Permits("spam@good.com", "anykey", false) {
		t.Fatal("legacy list should still block a listed sender")
	}
}

func TestMarshalRoundTrip(t *testing.T) {
	in := &List{Mode: ModeAllow, Domains: []string{"a.com"}, Senders: []string{"x@b.com"}, AllowVerified: true}
	data, err := in.Marshal()
	if err != nil {
		t.Fatal(err)
	}
	out, err := Unmarshal(data)
	if err != nil {
		t.Fatal(err)
	}
	if out.Mode != in.Mode || len(out.Domains) != 1 || len(out.Senders) != 1 || !out.AllowVerified {
		t.Fatalf("round-trip mismatch: %+v", out)
	}
}
