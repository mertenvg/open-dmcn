package bridge

import "strings"

// DomainProfile maps a bridge (legacy-facing) domain to its DMCN domain. A bridge serves one
// or more such pairs: inbound mail to a bridge domain is mapped to that pair's DMCN domain, and
// outbound mail from a DMCN sender is From-rewritten + DKIM-signed to the matching bridge
// domain. (DKIM keys are per bridge domain and live on the deliverer; see SMTPSender.)
type DomainProfile struct {
	BridgeDomain string
	DMCNDomain   string
}

// profileSet indexes a bridge's domain profiles for O(1) lookup by either side, with a default
// pair used when no profile matches — so a single-domain bridge keeps working unchanged.
type profileSet struct {
	byBridge      map[string]DomainProfile
	byDMCN        map[string]DomainProfile
	defaultBridge string
	defaultDMCN   string
}

// newProfileSet builds the index from the configured profiles, always also indexing the single
// {defaultBridge, defaultDMCN} pair (empty parts are ignored). With no extra profiles this is
// the legacy single-domain bridge.
func newProfileSet(profiles []DomainProfile, defaultBridge, defaultDMCN string) *profileSet {
	ps := &profileSet{
		byBridge:      map[string]DomainProfile{},
		byDMCN:        map[string]DomainProfile{},
		defaultBridge: defaultBridge,
		defaultDMCN:   defaultDMCN,
	}
	add := func(p DomainProfile) {
		if p.BridgeDomain == "" || p.DMCNDomain == "" {
			return
		}
		ps.byBridge[strings.ToLower(p.BridgeDomain)] = p
		ps.byDMCN[strings.ToLower(p.DMCNDomain)] = p
	}
	add(DomainProfile{BridgeDomain: defaultBridge, DMCNDomain: defaultDMCN})
	for _, p := range profiles {
		add(p)
	}
	return ps
}

// forBridgeDomain returns the {bridge, dmcn} pair for a recipient on bridgeDomain (inbound),
// defaulting to the configured default pair when none matches.
func (ps *profileSet) forBridgeDomain(bridgeDomain string) (bridge, dmcn string) {
	if p, ok := ps.byBridge[strings.ToLower(bridgeDomain)]; ok {
		return p.BridgeDomain, p.DMCNDomain
	}
	return ps.defaultBridge, ps.defaultDMCN
}

// forDMCNDomain returns the {bridge, dmcn} pair for a sender on dmcnDomain (outbound),
// defaulting to the configured default pair when none matches.
func (ps *profileSet) forDMCNDomain(dmcnDomain string) (bridge, dmcn string) {
	if p, ok := ps.byDMCN[strings.ToLower(dmcnDomain)]; ok {
		return p.BridgeDomain, p.DMCNDomain
	}
	return ps.defaultBridge, ps.defaultDMCN
}

// servesBridgeDomain reports whether bridgeDomain is one this set serves (RCPT confinement).
func (ps *profileSet) servesBridgeDomain(bridgeDomain string) bool {
	_, ok := ps.byBridge[strings.ToLower(bridgeDomain)]
	return ok
}

// dmcnDomains returns the DMCN domains served (the outbound open-relay guard's base set).
func (ps *profileSet) dmcnDomains() []string {
	out := make([]string, 0, len(ps.byDMCN))
	for d := range ps.byDMCN {
		out = append(out, d)
	}
	return out
}
