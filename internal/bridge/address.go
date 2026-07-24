package bridge

import "strings"

// SMTPToDMCN converts a bridge email address to the corresponding DMCN address.
// For example, "alice@bridge.localhost" → "alice@dmcn.localhost".
func SMTPToDMCN(smtpAddr, bridgeDomain, dmcnDomain string) string {
	local, domain := splitAddress(smtpAddr)
	if local == "" || !strings.EqualFold(domain, bridgeDomain) {
		return smtpAddr // not a bridge address, return as-is
	}
	return local + "@" + dmcnDomain
}

// DMCNToSMTPFrom converts a DMCN address to a bridge SMTP From address.
// For example, "alice@dmcn.localhost" → "alice@bridge.localhost".
func DMCNToSMTPFrom(dmcnAddr, bridgeDomain string) string {
	local, _ := splitAddress(dmcnAddr)
	if local == "" {
		return dmcnAddr
	}
	return local + "@" + bridgeDomain
}

// IsLegacyAddress returns true if the address domain is not the bridge
// domain or the DMCN domain — i.e., it is an external legacy email address.
func IsLegacyAddress(addr, bridgeDomain, dmcnDomain string) bool {
	_, domain := splitAddress(addr)
	if domain == "" {
		return false
	}
	return !strings.EqualFold(domain, bridgeDomain) &&
		!strings.EqualFold(domain, dmcnDomain)
}

func splitAddress(addr string) (local, domain string) {
	parts := strings.SplitN(addr, "@", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", ""
	}
	return parts[0], parts[1]
}
