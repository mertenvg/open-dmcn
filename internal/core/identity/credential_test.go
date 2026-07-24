package identity

import (
	"errors"
	"testing"
	"time"
)

// issue builds + signs a credential.
func issue(t *testing.T, issuer *IdentityKeyPair, subject *IdentityKeyPair, domain string, roles, grants []string, at time.Time) *Credential {
	t.Helper()
	c := &Credential{Version: 1, Subject: subject.Ed25519Public, Domain: domain, Roles: roles, Grants: grants, IssuedAt: at}
	if err := c.Sign(issuer); err != nil {
		t.Fatal(err)
	}
	return c
}

func TestVerifyCredentialChain(t *testing.T) {
	const domain = "example.com"
	base := time.Now().Add(-time.Hour).Truncate(time.Second)
	now := time.Now()

	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, base)
	dar.AuthorityEffectiveFrom = base // ensure root effective at our test times
	if err := dar.Sign(root); err != nil {
		t.Fatal(err)
	}

	// A sub-authority that may issue node + address (but NOT delegate further).
	sub := mustKP(t)
	subCred := issue(t, root, sub, domain, []string{RoleSubAuthority}, []string{RoleNode, RoleAddress}, base)
	dar.AuthorityCredentials = append(dar.AuthorityCredentials, *subCred)

	t.Run("root-issued node verifies", func(t *testing.T) {
		c := issue(t, root, mustKP(t), domain, []string{RoleNode}, nil, base)
		if err := VerifyCredential(c, dar, nil, now); err != nil {
			t.Fatalf("root-issued node should verify: %v", err)
		}
	})
	t.Run("sub-issued node verifies", func(t *testing.T) {
		c := issue(t, sub, mustKP(t), domain, []string{RoleNode}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err != nil {
			t.Fatalf("sub-issued node should verify: %v", err)
		}
	})
	t.Run("sub-issued combined address+client verifies", func(t *testing.T) {
		// address ∈ sub.Grants; client is NOT — so this must fail (escalation).
		c := issue(t, sub, mustKP(t), domain, []string{RoleAddress, RoleClient}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("sub may not grant a role outside its Grants")
		}
	})
	t.Run("role outside grants rejected", func(t *testing.T) {
		c := issue(t, sub, mustKP(t), domain, []string{RoleBridge}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("sub granted only node+address; bridge must be rejected")
		}
	})
	t.Run("non-delegator cannot create authority", func(t *testing.T) {
		// sub has no "grant" capability, so it cannot issue a Grants-bearing cred.
		c := issue(t, sub, mustKP(t), domain, []string{RoleSubAuthority}, []string{RoleNode}, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("a sub without 'grant' must not create sub-authorities")
		}
	})
	t.Run("issuer not in DAR rejected", func(t *testing.T) {
		mallory := mustKP(t)
		c := issue(t, mallory, mustKP(t), domain, []string{RoleNode}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("a self-issued cred (issuer not authorised by the DAR) must be rejected")
		}
	})
	t.Run("tampered cred rejected", func(t *testing.T) {
		c := issue(t, sub, mustKP(t), domain, []string{RoleNode}, nil, base.Add(time.Second))
		c.Roles = []string{RoleNode, RoleBridge} // mutate after signing
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("a tampered credential must fail signature verification")
		}
	})
}

func TestVerifyCredentialDelegation(t *testing.T) {
	const domain = "example.com"
	base := time.Now().Add(-time.Hour).Truncate(time.Second)
	now := time.Now()
	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, base)
	dar.AuthorityEffectiveFrom = base
	dar.Sign(root)

	// A delegating sub-authority (has "grant") may create a scoped sub-sub-authority.
	sub := mustKP(t)
	subCred := issue(t, root, sub, domain, []string{RoleSubAuthority}, []string{RoleNode, RoleAddress, GrantDelegate}, base)
	dar.AuthorityCredentials = append(dar.AuthorityCredentials, *subCred)

	subsub := mustKP(t)
	subsubCred := &Credential{Version: 1, Subject: subsub.Ed25519Public, Domain: domain, Roles: []string{RoleSubAuthority}, Grants: []string{RoleNode}, Scope: "eng." + domain, IssuedAt: base.Add(time.Second)}
	subsubCred.Sign(sub)
	dar.AuthorityCredentials = append(dar.AuthorityCredentials, *subsubCred)

	t.Run("3-level chain verifies", func(t *testing.T) {
		c := issue(t, subsub, mustKP(t), "eng."+domain, []string{RoleNode}, nil, base.Add(2*time.Second))
		if err := VerifyCredential(c, dar, nil, now); err != nil {
			t.Fatalf("root→sub→subsub→leaf should verify: %v", err)
		}
	})
	t.Run("scoped sub cannot issue outside scope", func(t *testing.T) {
		c := issue(t, subsub, mustKP(t), domain, []string{RoleNode}, nil, base.Add(2*time.Second)) // parent domain, not eng.
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("a sub scoped to eng.example.com must not issue for example.com")
		}
	})
}

func TestVerifyCredentialRotation(t *testing.T) {
	const domain = "example.com"
	tEarly := time.Now().Add(-2 * time.Hour).Truncate(time.Second)
	tRotate := time.Now().Add(-time.Hour).Truncate(time.Second)
	now := time.Now()

	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, tEarly)
	dar.AuthorityEffectiveFrom = tEarly
	dar.Sign(root)

	// A node cred issued by the (old) root before rotation.
	c := issue(t, root, mustKP(t), domain, []string{RoleNode}, nil, tEarly.Add(time.Second))

	// Rotate the root: old key → superseded, new key current from tRotate.
	newRoot := mustKP(t)
	dar.SupersededKeys = append(dar.SupersededKeys, AuthorityKey{Ed25519Public: root.Ed25519Public, X25519Public: root.X25519Public, EffectiveFrom: tEarly})
	dar.AuthorityEd25519 = newRoot.Ed25519Public
	dar.AuthorityX25519 = newRoot.X25519Public
	dar.AuthorityEffectiveFrom = tRotate
	dar.Revision++
	dar.Sign(newRoot)

	if err := VerifyCredential(c, dar, nil, now); err != nil {
		t.Fatalf("a cred signed by the rotated-but-not-blocked root before rotation must stay valid: %v", err)
	}
}

func TestVerifyCredentialBlocking(t *testing.T) {
	const domain = "example.com"
	base := time.Now().Add(-2 * time.Hour).Truncate(time.Second)
	tBlock := time.Now().Add(-time.Hour).Truncate(time.Second)
	now := time.Now()

	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, base)
	dar.AuthorityEffectiveFrom = base
	dar.Sign(root)
	sub := mustKP(t)
	dar.AuthorityCredentials = append(dar.AuthorityCredentials, *issue(t, root, sub, domain, []string{RoleSubAuthority}, []string{RoleNode}, base))

	before := issue(t, sub, mustKP(t), domain, []string{RoleNode}, nil, base.Add(time.Second))  // pre-block
	after := issue(t, sub, mustKP(t), domain, []string{RoleNode}, nil, tBlock.Add(time.Minute)) // post-block

	t.Run("retire is forward-only", func(t *testing.T) {
		bl := &CredentialBlockList{Domain: domain, Blocks: []CredentialBlock{{Pubkey: sub.Ed25519Public, EffectiveFrom: tBlock, CreatedAt: tBlock}}}
		if err := VerifyCredential(before, dar, bl, now); err != nil {
			t.Fatalf("a retire-blocked issuer's PRE-block cred must stay valid: %v", err)
		}
		if err := VerifyCredential(after, dar, bl, now); !errors.Is(err, ErrCredentialBlocked) {
			t.Fatalf("a retire-blocked issuer's POST-block cred must be rejected, got %v", err)
		}
	})
	t.Run("compromise invalidates all", func(t *testing.T) {
		bl := &CredentialBlockList{Domain: domain, Blocks: []CredentialBlock{{Pubkey: sub.Ed25519Public, EffectiveFrom: tBlock, Compromised: true, CreatedAt: tBlock}}}
		if err := VerifyCredential(before, dar, bl, now); !errors.Is(err, ErrCredentialBlocked) {
			t.Fatalf("a COMPROMISED issuer's pre-block cred must ALSO be rejected, got %v", err)
		}
	})
}

// TestClientIssuerByGrant exercises the grant-based capability model after removing the
// sub-authority-role issuer gate from verifyChain: a DAR-enrolled issuer whose ROLE is
// "client" (not sub-authority) may issue leaf credentials for the grants it holds, and only
// those. This is the web-issuer case — a `client` peer granted routing/address signs
// sub-credentials with its single key.
func TestClientIssuerByGrant(t *testing.T) {
	const domain = "web.example"
	base := time.Now().Add(-time.Hour).Truncate(time.Second)
	now := time.Now()

	root := mustKP(t)
	dar, _ := NewDomainAuthorityRecord(domain, root, base)
	dar.AuthorityEffectiveFrom = base
	if err := dar.Sign(root); err != nil {
		t.Fatal(err)
	}

	// A `client`-role issuer (e.g. the web) granted routing+address, enrolled in the DAR.
	web := mustKP(t)
	webCred := issue(t, root, web, domain, []string{RoleClient}, []string{GrantRouting, GrantAddress}, base)
	dar.AuthorityCredentials = append(dar.AuthorityCredentials, *webCred)

	t.Run("client+routing issues a routing leaf", func(t *testing.T) {
		c := issue(t, web, mustKP(t), domain, []string{RoleRouting}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err != nil {
			t.Fatalf("client issuer with 'routing' grant should issue a routing leaf: %v", err)
		}
	})
	t.Run("client+address issues an address leaf", func(t *testing.T) {
		c := issue(t, web, mustKP(t), domain, []string{RoleAddress}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err != nil {
			t.Fatalf("client issuer with 'address' grant should issue an address leaf: %v", err)
		}
	})
	t.Run("client issuer cannot issue a role it lacks", func(t *testing.T) {
		// 'node' is not in the web's grants → escalation, rejected.
		c := issue(t, web, mustKP(t), domain, []string{RoleNode}, nil, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("client issuer without the 'node' grant must not issue a node credential")
		}
	})
	t.Run("client issuer without 'grant' cannot create an authority", func(t *testing.T) {
		// web lacks GrantDelegate, so it cannot issue a grants-bearing (authority) credential.
		c := issue(t, web, mustKP(t), domain, []string{RoleClient}, []string{GrantRouting}, base.Add(time.Second))
		if err := VerifyCredential(c, dar, nil, now); err == nil {
			t.Fatal("client issuer without 'grant' must not create a grants-bearing credential")
		}
	})
}
