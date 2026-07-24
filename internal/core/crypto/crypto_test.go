package crypto

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"errors"
	"io"
	"testing"
)

// failReader is an io.Reader that always returns an error.
type failReader struct{}

func (failReader) Read([]byte) (int, error) {
	return 0, errors.New("entropy exhausted")
}

// withFailingRand temporarily replaces the random source with one that
// always fails, then restores it.
func withFailingRand(fn func()) {
	old := randReader
	randReader = failReader{}
	defer func() { randReader = old }()
	fn()
}

// limitedReader returns exactly n random bytes, then fails.
type limitedReader struct {
	remaining int
}

func (r *limitedReader) Read(p []byte) (int, error) {
	if r.remaining <= 0 {
		return 0, errors.New("entropy exhausted")
	}
	n := len(p)
	if n > r.remaining {
		n = r.remaining
	}
	actual, err := io.ReadFull(rand.Reader, p[:n])
	r.remaining -= actual
	if err != nil {
		return actual, err
	}
	if n < len(p) {
		return actual, errors.New("entropy exhausted")
	}
	return actual, nil
}

func TestGenerateEd25519KeyPair(t *testing.T) {
	pub, priv, err := GenerateEd25519KeyPair()
	if err != nil {
		t.Fatalf("GenerateEd25519KeyPair() error: %v", err)
	}
	if len(pub) != Ed25519PublicKeySize {
		t.Errorf("public key size = %d, want %d", len(pub), Ed25519PublicKeySize)
	}
	if len(priv) != Ed25519PrivateKeySize {
		t.Errorf("private key size = %d, want %d", len(priv), Ed25519PrivateKeySize)
	}
	// Public key should be derivable from private key
	derivedPub := priv.Public().(ed25519.PublicKey)
	if !bytes.Equal(pub, derivedPub) {
		t.Error("public key does not match derived from private key")
	}
}

func TestSignAndVerify(t *testing.T) {
	pub, priv, err := GenerateEd25519KeyPair()
	if err != nil {
		t.Fatalf("key generation: %v", err)
	}

	message := []byte("test message for signing")
	sig, err := Sign(priv, message)
	if err != nil {
		t.Fatalf("Sign() error: %v", err)
	}

	if len(sig) != Ed25519SignatureSize {
		t.Errorf("signature size = %d, want %d", len(sig), Ed25519SignatureSize)
	}

	if err := Verify(pub, message, sig); err != nil {
		t.Errorf("Verify() valid signature: %v", err)
	}
}

func TestVerifyInvalidSignature(t *testing.T) {
	pub, priv, _ := GenerateEd25519KeyPair()
	message := []byte("test message")
	sig, _ := Sign(priv, message)

	// Tamper with signature
	tampered := make([]byte, len(sig))
	copy(tampered, sig)
	tampered[0] ^= 0xff

	if err := Verify(pub, message, tampered); err == nil {
		t.Error("Verify() should fail with tampered signature")
	}

	// Wrong message
	if err := Verify(pub, []byte("different message"), sig); err == nil {
		t.Error("Verify() should fail with different message")
	}

	// Wrong key
	pub2, _, _ := GenerateEd25519KeyPair()
	if err := Verify(pub2, message, sig); err == nil {
		t.Error("Verify() should fail with wrong public key")
	}
}

func TestSignInvalidKey(t *testing.T) {
	_, err := Sign([]byte("short"), []byte("msg"))
	if err == nil {
		t.Error("Sign() should fail with invalid key size")
	}
}

func TestVerifyInvalidInputs(t *testing.T) {
	if err := Verify([]byte("short"), []byte("msg"), make([]byte, 64)); err == nil {
		t.Error("Verify() should fail with invalid public key size")
	}
	pub, _, _ := GenerateEd25519KeyPair()
	if err := Verify(pub, []byte("msg"), []byte("short")); err == nil {
		t.Error("Verify() should fail with invalid signature size")
	}
}

func TestGenerateX25519KeyPair(t *testing.T) {
	pub, priv, err := GenerateX25519KeyPair()
	if err != nil {
		t.Fatalf("GenerateX25519KeyPair() error: %v", err)
	}

	// Keys should not be all zeros
	if pub == [X25519KeySize]byte{} {
		t.Error("public key is all zeros")
	}
	if priv == [X25519KeySize]byte{} {
		t.Error("private key is all zeros")
	}
}

func TestX25519SharedSecret(t *testing.T) {
	pubA, privA, _ := GenerateX25519KeyPair()
	pubB, privB, _ := GenerateX25519KeyPair()

	secretAB, err := X25519SharedSecret(privA, pubB)
	if err != nil {
		t.Fatalf("X25519SharedSecret(A,B) error: %v", err)
	}

	secretBA, err := X25519SharedSecret(privB, pubA)
	if err != nil {
		t.Fatalf("X25519SharedSecret(B,A) error: %v", err)
	}

	if secretAB != secretBA {
		t.Error("shared secrets do not match (DH symmetry broken)")
	}

	if secretAB == [X25519KeySize]byte{} {
		t.Error("shared secret is all zeros")
	}
}

func TestDeriveKey(t *testing.T) {
	secret := []byte("input keying material")
	info := []byte("test context")

	key1, err := DeriveKey(secret, nil, info, 32)
	if err != nil {
		t.Fatalf("DeriveKey() error: %v", err)
	}
	if len(key1) != 32 {
		t.Errorf("key length = %d, want 32", len(key1))
	}

	// Same inputs should produce same output (deterministic)
	key2, _ := DeriveKey(secret, nil, info, 32)
	if !bytes.Equal(key1, key2) {
		t.Error("DeriveKey() not deterministic")
	}

	// Different info should produce different output
	key3, _ := DeriveKey(secret, nil, []byte("other context"), 32)
	if bytes.Equal(key1, key3) {
		t.Error("DeriveKey() same output for different info")
	}

	// Invalid length
	_, err = DeriveKey(secret, nil, info, 0)
	if err == nil {
		t.Error("DeriveKey() should fail with length 0")
	}
}

func TestAESGCMRoundTrip(t *testing.T) {
	key := make([]byte, AES256KeySize)
	copy(key, []byte("32-byte-test-key-for-aes256-gcm!"))

	plaintext := []byte("hello, this is a secret message")

	nonce, ciphertext, tag, err := AESGCMEncrypt(key, plaintext)
	if err != nil {
		t.Fatalf("AESGCMEncrypt() error: %v", err)
	}

	if len(nonce) != AESGCMNonceSize {
		t.Errorf("nonce size = %d, want %d", len(nonce), AESGCMNonceSize)
	}
	if len(tag) != AESGCMTagSize {
		t.Errorf("tag size = %d, want %d", len(tag), AESGCMTagSize)
	}

	decrypted, err := AESGCMDecrypt(key, nonce, ciphertext, tag)
	if err != nil {
		t.Fatalf("AESGCMDecrypt() error: %v", err)
	}

	if !bytes.Equal(plaintext, decrypted) {
		t.Error("decrypted text does not match original")
	}
}

func TestAESGCMTamperDetection(t *testing.T) {
	key := make([]byte, AES256KeySize)
	copy(key, []byte("32-byte-test-key-for-aes256-gcm!"))

	nonce, ciphertext, tag, _ := AESGCMEncrypt(key, []byte("secret"))

	// Tamper with ciphertext
	tampered := make([]byte, len(ciphertext))
	copy(tampered, ciphertext)
	tampered[0] ^= 0xff
	if _, err := AESGCMDecrypt(key, nonce, tampered, tag); err == nil {
		t.Error("AESGCMDecrypt() should fail with tampered ciphertext")
	}

	// Tamper with tag
	tamperedTag := make([]byte, len(tag))
	copy(tamperedTag, tag)
	tamperedTag[0] ^= 0xff
	if _, err := AESGCMDecrypt(key, nonce, ciphertext, tamperedTag); err == nil {
		t.Error("AESGCMDecrypt() should fail with tampered tag")
	}

	// Wrong key
	wrongKey := make([]byte, AES256KeySize)
	copy(wrongKey, []byte("different-key-for-aes256-gcm!!!!"))
	if _, err := AESGCMDecrypt(wrongKey, nonce, ciphertext, tag); err == nil {
		t.Error("AESGCMDecrypt() should fail with wrong key")
	}
}

func TestAESGCMInvalidKeySize(t *testing.T) {
	_, _, _, err := AESGCMEncrypt([]byte("short"), []byte("data"))
	if err == nil {
		t.Error("AESGCMEncrypt() should fail with invalid key size")
	}

	_, err = AESGCMDecrypt([]byte("short"), make([]byte, 12), []byte("data"), make([]byte, 16))
	if err == nil {
		t.Error("AESGCMDecrypt() should fail with invalid key size")
	}
}

func TestAESGCMInvalidNonceSize(t *testing.T) {
	key := make([]byte, AES256KeySize)
	_, err := AESGCMDecrypt(key, []byte("short"), []byte("data"), make([]byte, 16))
	if err == nil {
		t.Error("AESGCMDecrypt() should fail with invalid nonce size")
	}
}

func TestSHA256Hash(t *testing.T) {
	hash := SHA256Hash([]byte("test"))
	if len(hash) != SHA256Size {
		t.Errorf("hash size = %d, want %d", len(hash), SHA256Size)
	}

	// Same input should produce same hash
	hash2 := SHA256Hash([]byte("test"))
	if hash != hash2 {
		t.Error("SHA256Hash() not deterministic")
	}

	// Different input should produce different hash
	hash3 := SHA256Hash([]byte("other"))
	if hash == hash3 {
		t.Error("SHA256Hash() same output for different input")
	}
}

func TestRandomBytes(t *testing.T) {
	b, err := RandomBytes(32)
	if err != nil {
		t.Fatalf("RandomBytes() error: %v", err)
	}
	if len(b) != 32 {
		t.Errorf("length = %d, want 32", len(b))
	}

	// Two calls should produce different output (with overwhelming probability)
	b2, _ := RandomBytes(32)
	if bytes.Equal(b, b2) {
		t.Error("RandomBytes() produced identical output twice")
	}

	// Zero length
	b0, err := RandomBytes(0)
	if err != nil {
		t.Fatalf("RandomBytes(0) error: %v", err)
	}
	if len(b0) != 0 {
		t.Errorf("RandomBytes(0) length = %d, want 0", len(b0))
	}

	// Negative length
	_, err = RandomBytes(-1)
	if err == nil {
		t.Error("RandomBytes(-1) should fail")
	}
}

func TestRandomUUID(t *testing.T) {
	uuid, err := RandomUUID()
	if err != nil {
		t.Fatalf("RandomUUID() error: %v", err)
	}

	// Check version 4 bits
	if uuid[6]>>4 != 4 {
		t.Errorf("UUID version = %d, want 4", uuid[6]>>4)
	}
	// Check variant bits (should be 10xx xxxx)
	if uuid[8]>>6 != 2 {
		t.Errorf("UUID variant = %d, want 2", uuid[8]>>6)
	}

	// Two UUIDs should differ
	uuid2, _ := RandomUUID()
	if uuid == uuid2 {
		t.Error("RandomUUID() produced identical output twice")
	}
}

func TestAESGCMEmptyPlaintext(t *testing.T) {
	key := make([]byte, AES256KeySize)
	copy(key, []byte("32-byte-test-key-for-aes256-gcm!"))

	nonce, ciphertext, tag, err := AESGCMEncrypt(key, []byte{})
	if err != nil {
		t.Fatalf("AESGCMEncrypt(empty) error: %v", err)
	}

	decrypted, err := AESGCMDecrypt(key, nonce, ciphertext, tag)
	if err != nil {
		t.Fatalf("AESGCMDecrypt(empty) error: %v", err)
	}

	if len(decrypted) != 0 {
		t.Errorf("decrypted length = %d, want 0", len(decrypted))
	}
}

// Error path tests — test behavior when random source fails.

func TestGenerateEd25519KeyPairRandFailure(t *testing.T) {
	withFailingRand(func() {
		_, _, err := GenerateEd25519KeyPair()
		if err == nil {
			t.Error("GenerateEd25519KeyPair should fail with failing rand")
		}
	})
}

func TestGenerateX25519KeyPairRandFailure(t *testing.T) {
	withFailingRand(func() {
		_, _, err := GenerateX25519KeyPair()
		if err == nil {
			t.Error("GenerateX25519KeyPair should fail with failing rand")
		}
	})
}

func TestAESGCMEncryptRandFailure(t *testing.T) {
	key := make([]byte, AES256KeySize)
	copy(key, []byte("32-byte-test-key-for-aes256-gcm!"))

	withFailingRand(func() {
		_, _, _, err := AESGCMEncrypt(key, []byte("test"))
		if err == nil {
			t.Error("AESGCMEncrypt should fail with failing rand")
		}
	})
}

func TestRandomBytesRandFailure(t *testing.T) {
	withFailingRand(func() {
		_, err := RandomBytes(16)
		if err == nil {
			t.Error("RandomBytes should fail with failing rand")
		}
	})
}

func TestRandomUUIDRandFailure(t *testing.T) {
	withFailingRand(func() {
		_, err := RandomUUID()
		if err == nil {
			t.Error("RandomUUID should fail with failing rand")
		}
	})
}

func TestDeriveKeyWithSalt(t *testing.T) {
	secret := []byte("input keying material")
	salt := []byte("some salt value")
	info := []byte("test context")

	key, err := DeriveKey(secret, salt, info, 32)
	if err != nil {
		t.Fatalf("DeriveKey with salt: %v", err)
	}

	// With salt should differ from without salt
	keyNoSalt, _ := DeriveKey(secret, nil, info, 32)
	if bytes.Equal(key, keyNoSalt) {
		t.Error("DeriveKey with salt should differ from without salt")
	}

	// Negative length
	_, err = DeriveKey(secret, salt, info, -1)
	if err == nil {
		t.Error("DeriveKey should fail with negative length")
	}
}
