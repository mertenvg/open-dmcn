package bridge

import "testing"

func TestSMTPToDMCN(t *testing.T) {
	tests := []struct {
		smtp, bridge, dmcn, want string
	}{
		{"alice@bridge.localhost", "bridge.localhost", "dmcn.localhost", "alice@dmcn.localhost"},
		{"bob@bridge.localhost", "bridge.localhost", "dmcn.localhost", "bob@dmcn.localhost"},
		{"alice@Bridge.Localhost", "bridge.localhost", "dmcn.localhost", "alice@dmcn.localhost"},
		{"alice@gmail.com", "bridge.localhost", "dmcn.localhost", "alice@gmail.com"},
		{"", "bridge.localhost", "dmcn.localhost", ""},
		{"invalid", "bridge.localhost", "dmcn.localhost", "invalid"},
	}

	for _, tt := range tests {
		got := SMTPToDMCN(tt.smtp, tt.bridge, tt.dmcn)
		if got != tt.want {
			t.Errorf("SMTPToDMCN(%q, %q, %q) = %q, want %q", tt.smtp, tt.bridge, tt.dmcn, got, tt.want)
		}
	}
}

func TestDMCNToSMTPFrom(t *testing.T) {
	tests := []struct {
		dmcn, bridge, want string
	}{
		{"alice@dmcn.localhost", "bridge.localhost", "alice@bridge.localhost"},
		{"bob@dmcn.localhost", "bridge.localhost", "bob@bridge.localhost"},
		{"invalid", "bridge.localhost", "invalid"},
	}

	for _, tt := range tests {
		got := DMCNToSMTPFrom(tt.dmcn, tt.bridge)
		if got != tt.want {
			t.Errorf("DMCNToSMTPFrom(%q, %q) = %q, want %q", tt.dmcn, tt.bridge, got, tt.want)
		}
	}
}

func TestIsLegacyAddress(t *testing.T) {
	tests := []struct {
		addr, bridge, dmcn string
		want               bool
	}{
		{"bob@gmail.com", "bridge.localhost", "dmcn.localhost", true},
		{"alice@bridge.localhost", "bridge.localhost", "dmcn.localhost", false},
		{"alice@dmcn.localhost", "bridge.localhost", "dmcn.localhost", false},
		{"alice@Bridge.Localhost", "bridge.localhost", "dmcn.localhost", false},
		{"invalid", "bridge.localhost", "dmcn.localhost", false},
		{"", "bridge.localhost", "dmcn.localhost", false},
	}

	for _, tt := range tests {
		got := IsLegacyAddress(tt.addr, tt.bridge, tt.dmcn)
		if got != tt.want {
			t.Errorf("IsLegacyAddress(%q, %q, %q) = %v, want %v", tt.addr, tt.bridge, tt.dmcn, got, tt.want)
		}
	}
}
