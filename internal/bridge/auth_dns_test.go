package bridge

import (
	"context"
	"errors"
	"io"
	"net"
	"testing"

	"blitiri.com.ar/go/spf"
	"github.com/emersion/go-msgauth/dkim"
	"github.com/emersion/go-msgauth/dmarc"
)

// setAuthFakes replaces the package-level DNS hooks with deterministic fakes for
// the duration of a test, so the full SPF/DKIM/DMARC logic runs without network.
// The hooks are global, so tests using this must not call t.Parallel().
func setAuthFakes(t *testing.T,
	spfFn func(ctx context.Context, ip net.IP, helo, sender string) (spf.Result, error),
	dkimFn func(r io.Reader) ([]*dkim.Verification, error),
	dmarcFn func(domain string) (*dmarc.Record, error),
) {
	t.Helper()
	origSPF, origDKIM, origDMARC := authSPFCheck, authDKIMVerify, authDMARCLookup
	if spfFn != nil {
		authSPFCheck = spfFn
	}
	if dkimFn != nil {
		authDKIMVerify = dkimFn
	}
	if dmarcFn != nil {
		authDMARCLookup = dmarcFn
	}
	t.Cleanup(func() {
		authSPFCheck = origSPF
		authDKIMVerify = origDKIM
		authDMARCLookup = origDMARC
	})
}

func constSPF(r spf.Result, err error) func(context.Context, net.IP, string, string) (spf.Result, error) {
	return func(context.Context, net.IP, string, string) (spf.Result, error) { return r, err }
}
func constDKIM(v []*dkim.Verification, err error) func(io.Reader) ([]*dkim.Verification, error) {
	return func(io.Reader) ([]*dkim.Verification, error) { return v, err }
}
func constDMARC(rec *dmarc.Record, err error) func(string) (*dmarc.Record, error) {
	return func(string) (*dmarc.Record, error) { return rec, err }
}

func TestMapSPFResult(t *testing.T) {
	cases := map[spf.Result]SPFResult{
		spf.Pass:      SPFPass,
		spf.Fail:      SPFFail,
		spf.SoftFail:  SPFSoftFail,
		spf.Neutral:   SPFNeutral,
		spf.None:      SPFNone,
		spf.TempError: SPFNone,
		spf.PermError: SPFNone,
	}
	for in, want := range cases {
		if got := mapSPFResult(in); got != want {
			t.Errorf("mapSPFResult(%q) = %d, want %d", in, got, want)
		}
	}
}

func TestVerifyDKIM(t *testing.T) {
	tests := []struct {
		name        string
		verifs      []*dkim.Verification
		err         error
		wantResult  DKIMResult
		wantDomains []string
	}{
		{name: "no signatures", verifs: nil, wantResult: DKIMNone},
		{name: "parse error, no verifs", err: errors.New("bad header"), wantResult: DKIMNone},
		{
			name:        "one valid signature",
			verifs:      []*dkim.Verification{{Domain: "Example.com", Err: nil}},
			wantResult:  DKIMPass,
			wantDomains: []string{"example.com"},
		},
		{
			name:       "one invalid signature",
			verifs:     []*dkim.Verification{{Domain: "example.com", Err: errors.New("bad sig")}},
			wantResult: DKIMFail,
		},
		{
			name: "mixed: one fails one passes",
			verifs: []*dkim.Verification{
				{Domain: "broken.com", Err: errors.New("bad sig")},
				{Domain: "good.com", Err: nil},
			},
			wantResult:  DKIMPass,
			wantDomains: []string{"good.com"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setAuthFakes(t, nil, constDKIM(tt.verifs, tt.err), nil)
			domains, res := verifyDKIM([]byte("ignored"))
			if res != tt.wantResult {
				t.Fatalf("result = %d, want %d", res, tt.wantResult)
			}
			if len(domains) != len(tt.wantDomains) {
				t.Fatalf("domains = %v, want %v", domains, tt.wantDomains)
			}
			for i := range domains {
				if domains[i] != tt.wantDomains[i] {
					t.Fatalf("domains[%d] = %q, want %q", i, domains[i], tt.wantDomains[i])
				}
			}
		})
	}
}

func TestDomainsAligned(t *testing.T) {
	tests := []struct {
		a, b string
		mode dmarc.AlignmentMode
		want bool
	}{
		{"example.com", "example.com", dmarc.AlignmentStrict, true},
		{"example.com", "example.com", dmarc.AlignmentRelaxed, true},
		{"mail.example.com", "example.com", dmarc.AlignmentStrict, false},
		{"mail.example.com", "example.com", dmarc.AlignmentRelaxed, true},
		{"example.com", "other.com", dmarc.AlignmentRelaxed, false},
		{"example.com.", "example.com", dmarc.AlignmentStrict, true}, // trailing dot tolerated
		{"", "example.com", dmarc.AlignmentRelaxed, false},
	}
	for _, tt := range tests {
		if got := domainsAligned(tt.a, tt.b, tt.mode); got != tt.want {
			t.Errorf("domainsAligned(%q,%q,%q) = %v, want %v", tt.a, tt.b, tt.mode, got, tt.want)
		}
	}
}

func TestEvalDMARC(t *testing.T) {
	rejectRelaxed := &dmarc.Record{Policy: dmarc.PolicyReject, SPFAlignment: dmarc.AlignmentRelaxed, DKIMAlignment: dmarc.AlignmentRelaxed}
	quarantineStrict := &dmarc.Record{Policy: dmarc.PolicyQuarantine, SPFAlignment: dmarc.AlignmentStrict, DKIMAlignment: dmarc.AlignmentStrict}

	tests := []struct {
		name           string
		envelopeDomain string
		fromDomain     string
		spf            SPFResult
		dkimPass       []string
		rec            *dmarc.Record
		lookupErr      error
		wantResult     DMARCResult
		wantPolicy     DMARCPolicy
	}{
		{name: "no from domain", fromDomain: "", wantResult: DMARCNone, wantPolicy: DMARCPolicyNone},
		{
			name: "no dmarc record", fromDomain: "example.com", lookupErr: dmarc.ErrNoPolicy,
			wantResult: DMARCNone, wantPolicy: DMARCPolicyNone,
		},
		{
			name: "spf aligned pass", envelopeDomain: "example.com", fromDomain: "example.com",
			spf: SPFPass, rec: rejectRelaxed, wantResult: DMARCPass, wantPolicy: DMARCPolicyReject,
		},
		{
			name: "dkim aligned pass", envelopeDomain: "bounce.mailer.net", fromDomain: "example.com",
			spf: SPFNone, dkimPass: []string{"example.com"}, rec: rejectRelaxed,
			wantResult: DMARCPass, wantPolicy: DMARCPolicyReject,
		},
		{
			name: "nothing aligned fails", envelopeDomain: "evil.com", fromDomain: "example.com",
			spf: SPFPass, dkimPass: []string{"evil.com"}, rec: rejectRelaxed,
			wantResult: DMARCFail, wantPolicy: DMARCPolicyReject,
		},
		{
			name: "spf pass but strict misalignment fails", envelopeDomain: "mail.example.com", fromDomain: "example.com",
			spf: SPFPass, rec: quarantineStrict, wantResult: DMARCFail, wantPolicy: DMARCPolicyQuarantine,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setAuthFakes(t, nil, nil, constDMARC(tt.rec, tt.lookupErr))
			res, pol := evalDMARC(tt.envelopeDomain, tt.fromDomain, tt.spf, tt.dkimPass)
			if res != tt.wantResult || pol != tt.wantPolicy {
				t.Fatalf("evalDMARC = (%d,%d), want (%d,%d)", res, pol, tt.wantResult, tt.wantPolicy)
			}
		})
	}
}

const testMsg = "From: Alice <alice@example.com>\r\n" +
	"To: bob@bridge.localhost\r\n" +
	"Subject: hi\r\n" +
	"\r\n" +
	"body\r\n"

func TestDNSAuthVerifier_VerifyPass(t *testing.T) {
	setAuthFakes(t,
		constSPF(spf.Pass, nil),
		constDKIM([]*dkim.Verification{{Domain: "example.com", Err: nil}}, nil),
		constDMARC(&dmarc.Record{Policy: dmarc.PolicyReject, SPFAlignment: dmarc.AlignmentRelaxed, DKIMAlignment: dmarc.AlignmentRelaxed}, nil),
	)
	v := NewDNSAuthVerifier()
	res, err := v.Verify(context.Background(), "1.2.3.4:5678", "alice@example.com", []byte(testMsg))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.SPF != SPFPass || res.DKIM != DKIMPass || res.DMARC != DMARCPass {
		t.Fatalf("results = SPF %d DKIM %d DMARC %d", res.SPF, res.DKIM, res.DMARC)
	}
	if res.DMARCPolicy != DMARCPolicyReject {
		t.Fatalf("policy = %d, want reject", res.DMARCPolicy)
	}
	if res.SenderIP != "1.2.3.4:5678" {
		t.Fatalf("sender ip = %q", res.SenderIP)
	}
	if ShouldReject(res) {
		t.Fatal("a passing message must not be rejected")
	}
	if Classify(res) != TrustTierVerifiedLegacy {
		t.Fatal("a passing message must classify as verified legacy")
	}
}

func TestDNSAuthVerifier_VerifyRejectsHardFail(t *testing.T) {
	// SPF fail + no aligned DKIM, under a published p=reject DMARC policy →
	// DMARC fail under reject → must be dropped.
	setAuthFakes(t,
		constSPF(spf.Fail, nil),
		constDKIM(nil, nil),
		constDMARC(&dmarc.Record{Policy: dmarc.PolicyReject, SPFAlignment: dmarc.AlignmentRelaxed, DKIMAlignment: dmarc.AlignmentRelaxed}, nil),
	)
	v := NewDNSAuthVerifier()
	res, err := v.Verify(context.Background(), "9.9.9.9", "alice@example.com", []byte(testMsg))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.SPF != SPFFail || res.DMARC != DMARCFail {
		t.Fatalf("results = SPF %d DMARC %d", res.SPF, res.DMARC)
	}
	if !ShouldReject(res) {
		t.Fatal("DMARC fail under reject policy must be rejected")
	}
}

func TestDNSAuthVerifier_VerifyUnparseableFrom(t *testing.T) {
	// No From header → no DMARC domain → DMARCNone; SPF still evaluated.
	setAuthFakes(t, constSPF(spf.Pass, nil), constDKIM(nil, nil), constDMARC(nil, dmarc.ErrNoPolicy))
	v := NewDNSAuthVerifier()
	res, err := v.Verify(context.Background(), "1.2.3.4", "alice@example.com", []byte("not a valid rfc5322 message"))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if res.DMARC != DMARCNone {
		t.Fatalf("DMARC = %d, want none", res.DMARC)
	}
	if ShouldReject(res) {
		t.Fatal("must not reject when there is no DMARC policy")
	}
}
