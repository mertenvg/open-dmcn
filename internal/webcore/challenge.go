package webcore

import (
	"crypto/rand"
	"sync"
	"time"
)

// ChallengeStore issues and tracks short-lived challenge nonces keyed by address,
// backing the challenge-response flows (mail-client login/import, the b2c account
// auth): the server mints a nonce, the browser signs it with the identity's
// Ed25519 key, and the server verifies against the registered public key.
type ChallengeStore struct {
	ttl     time.Duration
	pending sync.Map // address -> issuedChallenge
}

type issuedChallenge struct {
	nonce     []byte
	expiresAt time.Time
}

// NewChallengeStore creates a store whose nonces expire after ttl (default 60s
// when ttl <= 0).
func NewChallengeStore(ttl time.Duration) *ChallengeStore {
	if ttl <= 0 {
		ttl = 60 * time.Second
	}
	return &ChallengeStore{ttl: ttl}
}

// Issue mints and stores a fresh 32-byte nonce for the key, replacing any
// outstanding one.
func (c *ChallengeStore) Issue(key string) ([]byte, error) {
	nonce := make([]byte, 32)
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	c.pending.Store(key, issuedChallenge{nonce: nonce, expiresAt: time.Now().Add(c.ttl)})
	return nonce, nil
}

// Get returns the outstanding nonce for the key, or false when none is pending
// or it has expired (an expired entry is dropped). The nonce stays pending until
// Delete — a failed signature must not consume it, so the client can retry.
func (c *ChallengeStore) Get(key string) ([]byte, bool) {
	v, ok := c.pending.Load(key)
	if !ok {
		return nil, false
	}
	ch := v.(issuedChallenge)
	if time.Now().After(ch.expiresAt) {
		c.pending.Delete(key)
		return nil, false
	}
	return ch.nonce, true
}

// Delete consumes the key's outstanding nonce (call after successful verification).
func (c *ChallengeStore) Delete(key string) {
	c.pending.Delete(key)
}
