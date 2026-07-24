// Package mailfilter models a recipient's mail block/allow policy (P5 of the
// domain-anchored federation plan). The policy is the plaintext that gets sealed
// (message.SealToRecipients) to the recipient's identity key AND the mailbox key,
// so the mailbox can decrypt it to silently drop blocked senders at STORE while
// the owner edits it across devices. This package is pure logic — no crypto, no
// I/O — so it is trivially testable and reusable on either side of the wire.
package mailfilter

import (
	"encoding/json"
	"strings"
)

// Mode selects deny-list (default-allow, drop listed) or allow-list
// (default-deny, keep only listed/verified) semantics.
const (
	ModeDeny  = "deny"
	ModeAllow = "allow"
)

// List is a recipient's filter policy. Granularity is domain OR specific sender.
type List struct {
	Mode    string   `json:"mode"`    // "deny" (default) or "allow"
	Domains []string `json:"domains"` // domains (matched case-insensitively)
	Senders []string `json:"senders"` // full addresses local@domain
	// AllowVerified (allow-mode only) also admits any sender whose identity is
	// domain-verified (TierDomainDNS), so a default-deny inbox can still accept
	// "anyone with a DNS-anchored, countersigned address" without listing each.
	AllowVerified bool `json:"allow_verified"`
	// SenderKeys is the personal blocklist (§14.3.1): hex-encoded ed25519 public
	// keys that are ALWAYS dropped, regardless of Mode. Because it is bound to the
	// cryptographic identity rather than the address string, a blocked sender cannot
	// evade it by registering a new address. omitempty keeps old sealed blobs
	// (which lack the field) byte-compatible.
	SenderKeys []string `json:"sender_keys,omitempty"`
}

// Permits reports whether a message from senderAddr (whose identity is `verified`
// = domain-countersigned/DNS-anchored, and whose ed25519 public key is senderKeyHex)
// should be delivered. An empty/zero list permits everything (deny-list with no
// entries). A SenderKeys match blocks unconditionally — the personal blocklist takes
// precedence over any allow-mode admission.
func (l *List) Permits(senderAddr, senderKeyHex string, verified bool) bool {
	if l == nil {
		return true
	}
	if l.hasKey(senderKeyHex) {
		return false
	}
	matched := l.has(senderAddr)
	switch l.Mode {
	case ModeAllow:
		return matched || (l.AllowVerified && verified)
	default: // deny-list
		return !matched
	}
}

// hasKey reports whether senderKeyHex is on the key-bound blocklist (case-insensitive).
func (l *List) hasKey(senderKeyHex string) bool {
	if senderKeyHex == "" {
		return false
	}
	k := strings.ToLower(strings.TrimSpace(senderKeyHex))
	for _, s := range l.SenderKeys {
		if strings.ToLower(strings.TrimSpace(s)) == k {
			return true
		}
	}
	return false
}

// has reports whether senderAddr or its domain is listed.
func (l *List) has(senderAddr string) bool {
	addr := strings.ToLower(strings.TrimSpace(senderAddr))
	for _, s := range l.Senders {
		if strings.ToLower(strings.TrimSpace(s)) == addr {
			return true
		}
	}
	domain := addr
	if i := strings.LastIndex(addr, "@"); i >= 0 {
		domain = addr[i+1:]
	}
	for _, d := range l.Domains {
		if strings.ToLower(strings.TrimSpace(d)) == domain {
			return true
		}
	}
	return false
}

// Marshal serializes the list to canonical JSON (the plaintext that gets sealed).
func (l *List) Marshal() ([]byte, error) { return json.Marshal(l) }

// Unmarshal parses a list from its JSON plaintext.
func Unmarshal(data []byte) (*List, error) {
	var l List
	if err := json.Unmarshal(data, &l); err != nil {
		return nil, err
	}
	return &l, nil
}
