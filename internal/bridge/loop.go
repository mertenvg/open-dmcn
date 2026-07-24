package bridge

import (
	"bytes"
	"net/mail"
	"strings"
)

// maxReceivedHops is the maximum number of Received header fields permitted on
// an inbound message before it is treated as a forwarding loop. Each MTA a
// message traverses prepends one Received header, so an unusually deep chain is
// the classic mail-loop signal. The value matches common MTA defaults (e.g.
// Postfix's hopcount_limit of 50, kept conservative here).
const maxReceivedHops = 25

// parseHeaders extracts the RFC5322 header block from a raw message. The body is
// not consumed beyond the headers.
func parseHeaders(raw []byte) (mail.Header, error) {
	msg, err := mail.ReadMessage(bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	return msg.Header, nil
}

// receivedHopCount returns the number of Received header fields, the standard
// indicator of how many MTAs a message has traversed.
func receivedHopCount(h mail.Header) int {
	return len(h["Received"])
}

// isAutoSubmitted reports whether the message is machine-generated per RFC 3834
// (any Auto-Submitted value other than "no"), or carries a bulk/auto Precedence.
// Auto-generated mail must not be answered with bounces or auto-replies, to
// avoid feedback loops.
func isAutoSubmitted(h mail.Header) bool {
	if v := strings.ToLower(strings.TrimSpace(h.Get("Auto-Submitted"))); v != "" && v != "no" {
		return true
	}
	switch strings.ToLower(strings.TrimSpace(h.Get("Precedence"))) {
	case "bulk", "list", "junk", "auto_reply":
		return true
	}
	return false
}

// isNullSender reports whether the SMTP envelope sender is the null reverse-path
// (MAIL FROM:<>), which RFC 5321 reserves for bounces and other notifications
// that must never themselves generate a bounce.
func isNullSender(from string) bool {
	f := strings.TrimSpace(from)
	return f == "" || f == "<>"
}
