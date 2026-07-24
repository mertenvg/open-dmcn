package node

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/libp2p/go-libp2p/core/crypto"
)

// LoadOrCreateIdentityKey loads a marshaled libp2p private key from path, or, if
// the file does not exist, generates a new Ed25519 key and atomically publishes
// it at path (0600, parent directories created 0700).
//
// A persistent identity key gives a node a stable peer ID across restarts, so
// that full /p2p/<peerID> multiaddrs can be configured statically (see
// blade.yaml and the committed dev keys in dev/keys/).
//
// It is safe for multiple processes to call this concurrently on the same path:
// publication uses os.Link, which is atomic and fails if the target already
// exists, so exactly one generated key wins and every caller returns that key.
// A corrupt key file is reported as an error rather than silently regenerated —
// regenerating would change the peer ID and desynchronize the static multiaddrs
// other services have already computed from the same file.
func LoadOrCreateIdentityKey(path string) (crypto.PrivKey, error) {
	if priv, err := readIdentityKey(path); err == nil {
		return priv, nil
	} else if !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, fmt.Errorf("node: create identity key dir: %w", err)
	}

	priv, _, err := crypto.GenerateEd25519Key(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("node: generate identity key: %w", err)
	}
	data, err := crypto.MarshalPrivateKey(priv)
	if err != nil {
		return nil, fmt.Errorf("node: marshal identity key: %w", err)
	}

	// Write to a temp file in the same directory, then publish via os.Link so a
	// concurrent reader never observes a partially written key.
	tmp, err := os.CreateTemp(dir, ".identity-*.tmp")
	if err != nil {
		return nil, fmt.Errorf("node: create temp identity key: %w", err)
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return nil, fmt.Errorf("node: chmod temp identity key: %w", err)
	}
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return nil, fmt.Errorf("node: write temp identity key: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return nil, fmt.Errorf("node: close temp identity key: %w", err)
	}

	if err := os.Link(tmpName, path); err != nil {
		// Lost the race: another process published first. Its file is complete
		// (it too was linked from a fully written temp file), so read it back.
		if errors.Is(err, fs.ErrExist) {
			priv, rerr := readIdentityKey(path)
			if rerr != nil {
				return nil, rerr
			}
			return priv, nil
		}
		return nil, fmt.Errorf("node: publish identity key %s: %w", path, err)
	}
	return priv, nil
}

// readIdentityKey reads and unmarshals a key file. A missing file returns an
// error satisfying errors.Is(err, fs.ErrNotExist); a present-but-unparseable
// file returns a descriptive error.
func readIdentityKey(path string) (crypto.PrivKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	priv, err := crypto.UnmarshalPrivateKey(data)
	if err != nil {
		return nil, fmt.Errorf("node: identity key %s is corrupt (delete it to regenerate): %w", path, err)
	}
	return priv, nil
}
