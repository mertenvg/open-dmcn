package bridge

import "testing"

func TestClassify(t *testing.T) {
	tests := []struct {
		name string
		auth AuthResult
		want BridgeTrustTier
	}{
		{
			name: "all pass",
			auth: AuthResult{SPF: SPFPass, DKIM: DKIMPass, DMARC: DMARCPass},
			want: TrustTierVerifiedLegacy,
		},
		{
			name: "dkim pass dmarc pass spf fail",
			auth: AuthResult{SPF: SPFFail, DKIM: DKIMPass, DMARC: DMARCPass},
			want: TrustTierVerifiedLegacy,
		},
		{
			name: "dkim fail",
			auth: AuthResult{SPF: SPFPass, DKIM: DKIMFail, DMARC: DMARCPass},
			want: TrustTierSuspicious,
		},
		{
			name: "dmarc fail",
			auth: AuthResult{SPF: SPFPass, DKIM: DKIMPass, DMARC: DMARCFail},
			want: TrustTierSuspicious,
		},
		{
			name: "both fail",
			auth: AuthResult{SPF: SPFFail, DKIM: DKIMFail, DMARC: DMARCFail},
			want: TrustTierSuspicious,
		},
		{
			name: "all none",
			auth: AuthResult{SPF: SPFNone, DKIM: DKIMNone, DMARC: DMARCNone},
			want: TrustTierUnverifiedLegacy,
		},
		{
			name: "dkim pass dmarc none",
			auth: AuthResult{SPF: SPFPass, DKIM: DKIMPass, DMARC: DMARCNone},
			want: TrustTierUnverifiedLegacy,
		},
		{
			name: "dkim none dmarc pass",
			auth: AuthResult{SPF: SPFPass, DKIM: DKIMNone, DMARC: DMARCPass},
			want: TrustTierUnverifiedLegacy,
		},
		{
			name: "spf softfail only",
			auth: AuthResult{SPF: SPFSoftFail, DKIM: DKIMNone, DMARC: DMARCNone},
			want: TrustTierUnverifiedLegacy,
		},
		{
			// SPF hard fail with no other authentication is a downgrade signal.
			name: "spf fail only",
			auth: AuthResult{SPF: SPFFail, DKIM: DKIMNone, DMARC: DMARCNone},
			want: TrustTierSuspicious,
		},
		{
			// SPF fail must not override a DKIM+DMARC pass (forwarded mail).
			name: "spf fail but dkim+dmarc pass stays verified",
			auth: AuthResult{SPF: SPFFail, DKIM: DKIMPass, DMARC: DMARCPass},
			want: TrustTierVerifiedLegacy,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Classify(&tt.auth)
			if got != tt.want {
				t.Errorf("Classify() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestShouldReject(t *testing.T) {
	tests := []struct {
		name string
		auth AuthResult
		want bool
	}{
		{
			name: "dmarc fail under reject policy is dropped",
			auth: AuthResult{DMARC: DMARCFail, DMARCPolicy: DMARCPolicyReject},
			want: true,
		},
		{
			name: "dmarc fail under quarantine policy is delivered",
			auth: AuthResult{DMARC: DMARCFail, DMARCPolicy: DMARCPolicyQuarantine},
			want: false,
		},
		{
			name: "dmarc fail under no policy is delivered",
			auth: AuthResult{DMARC: DMARCFail, DMARCPolicy: DMARCPolicyNone},
			want: false,
		},
		{
			name: "dmarc pass under reject policy is delivered",
			auth: AuthResult{DMARC: DMARCPass, DMARCPolicy: DMARCPolicyReject},
			want: false,
		},
		{
			// A bare DKIM failure without an enforcing DMARC policy is not dropped.
			name: "dkim fail alone is delivered",
			auth: AuthResult{DKIM: DKIMFail, DMARC: DMARCNone, DMARCPolicy: DMARCPolicyNone},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ShouldReject(&tt.auth); got != tt.want {
				t.Errorf("ShouldReject() = %v, want %v", got, tt.want)
			}
		})
	}
}
