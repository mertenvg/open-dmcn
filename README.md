# open-dmcn

The open core of the **DMCN protocol** — the Decentralized Mesh Communication Network, a
peer-to-peer, end-to-end-encrypted store-and-forward mail network where **cryptographic
identity replaces SMTP-style trust**.

This repository is the **canonical home of the core protocol schema**: everything an
independent implementation needs to interoperate — resolve addresses, verify identities,
send and receive mail. It deliberately contains **no product machinery**: operator fleet
administration, hosting permits, provisioning, entitlements and client-convenience
surfaces are extensions maintained elsewhere (they ride their own libp2p protocols and a
generic, signature-covered extension surface — see SPEC.md §8).

## Layout

```
proto/
  identity.proto   dmcn.identity — identity records, credentials, domain authority,
                   blocklists, removals, fleet rosters, relay descriptors
  message.proto    dmcn.message  — the three-layer message model + encrypted envelope
  relay.proto      dmcn.relay    — the /dmcn/relay/1.0.0 wire protocol (mail interop)
  bridge.proto     dmcn.bridge   — OPTIONAL capability: SMTP-bridge attestation payloads
dmcnpb/            generated Go (committed; import github.com/mertenvg/open-dmcn/dmcnpb)
SPEC.md            the protocol reference (a snapshot of the reference implementation)
```

`bridge.proto` is an **optional capability** like onion routing: a conforming
implementation need not run an SMTP bridge, but if it does, these are the attestation
formats (they are end-to-end-sealed message payloads, not wire ops).

## Schema rules

- **Never reuse a reserved field or arm number.** Vacated numbers carry `reserved` +
  gravestone comments; they are part of the protocol's history.
- **Breaking checks are PACKAGE-level** (`buf breaking`); the proto **package names**
  (`dmcn.identity`, …) are load-bearing for reflection-based consumers and never change.
- Extensions attach through the designed extension points (`IdentityRecord.
  operator_credentials`, `ext.`-prefixed `Credential.attributes` keys, separate libp2p
  protocol IDs) — never through new core fields.

## Regenerate

```bash
buf lint && buf generate   # emits dmcnpb/ (requires buf + protoc-gen-go)
```

## Status

A **reference snapshot, not a frozen specification**: the schema is versioned with the
reference implementation, which remains authoritative where they disagree. The
single-domain self-host server is planned to live here.

## License

Licensed under the **Apache License, Version 2.0** — see [LICENSE](LICENSE) and
[NOTICE](NOTICE). The license includes an express patent grant with defensive
termination: you may implement this protocol without fear of patent assertion by its
authors, and that grant terminates for anyone who initiates patent litigation over it.

## Trademarks

The **"DMCN" name** identifies this protocol and interoperable implementations of it.
The Apache License covers the code and schema in this repository; it does **not** grant
rights to the DMCN name or any associated logos. You are free to implement the protocol
under any name; calling an implementation, service, or fork "DMCN" (or confusingly
similar) requires that it genuinely interoperate with the protocol specified here, and
names implying endorsement by or affiliation with the DMCN project require permission.
This keeps the name meaning what users think it means: an implementation that speaks
this protocol.
