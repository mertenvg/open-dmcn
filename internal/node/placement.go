package node

import "context"

// NOTE (open-dmcn reference implementation): load-aware HRW placement over a domain's
// relay fleet — the STAT-probe ranking + the RequestMailbox reserve handshake — is a
// multi-relay operator feature. A single self-hosted node hosts every mailbox for its
// domain, so a mailbox's relay hints are simply the node's own dialable address(es).

// defaultReplicas is retained for API compatibility (unused on a single node).
const defaultReplicas = 1

// ComputeRelayHints returns the node's own relay hint(s) — a single self-host node is the
// only home for its domain's mailboxes. k/exclude are ignored.
func (n *Node) ComputeRelayHints(_ context.Context, _ string, _ int, _ []string) ([]string, error) {
	return n.RelayHints(), nil
}

// ReserveRelayHints is the reserve-before-commit variant; on a single node the mailbox is
// always local, so it returns the node's own hint(s) with no remote reservation handshake.
func (n *Node) ReserveRelayHints(_ context.Context, _ string, _ string, _ int, _ []string) ([]string, error) {
	return n.RelayHints(), nil
}
