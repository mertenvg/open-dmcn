package bridge

import "context"

// StubAuthVerifier is an AuthVerifier that returns configurable default
// results. It is used for PoC and localhost testing where real SPF/DKIM/DMARC
// verification requires DNS infrastructure that is not available.
type StubAuthVerifier struct {
	DefaultSPF   SPFResult
	DefaultDKIM  DKIMResult
	DefaultDMARC DMARCResult
}

// Verify returns the configured default results for all inputs.
func (s *StubAuthVerifier) Verify(_ context.Context, senderIP string, _ string, _ []byte) (*AuthResult, error) {
	return &AuthResult{
		SPF:      s.DefaultSPF,
		DKIM:     s.DefaultDKIM,
		DMARC:    s.DefaultDMARC,
		SenderIP: senderIP,
	}, nil
}
