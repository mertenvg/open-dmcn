.PHONY: build build-web build-daemon proto proto-web test test-cover lint vet clean tidy

# Version string embedded at build time (best-effort git describe).
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
LDFLAGS := -ldflags "-X main.version=$(VERSION)"

WEB := cmd/dmcnd/web

# build produces the self-contained daemon (bin/dmcnd) + the operator CLI (bin/dmcndcli). It first
# builds the embedded web SPA (so //go:embed web/dist is fresh), then compiles the Go binaries.
build: build-web build-daemon build-cli

build-daemon:
	go build $(LDFLAGS) -o bin/dmcnd ./cmd/dmcnd

# build-cli compiles the standalone operator tool (peer-id + _dmcn DNS record).
build-cli:
	go build $(LDFLAGS) -o bin/dmcndcli ./cmd/dmcndcli

# build-web installs frontend deps and produces cmd/dmcnd/web/dist (embedded by the daemon).
build-web:
	cd $(WEB) && npm ci && npm run build

# proto-web regenerates the browser protobuf bundle (dmcn.js) from the CORE protos only —
# identity + message + relay. It MUST list every proto in the bundle; a partial run silently
# drops whole namespaces. bridge.js is a separate single-proto module — regenerate it manually.
PBJS = cd $(WEB) && npx -y -p protobufjs-cli@1.1.3 pbjs -t static-module -w es6 -p ../../../proto
PBTS = cd $(WEB) && npx -y -p protobufjs-cli@1.1.3 pbts
CORE_PROTOS = ../../../proto/identity.proto ../../../proto/message.proto ../../../proto/relay.proto

proto-web:
	$(PBJS) -o src/lib/proto/dmcn.js $(CORE_PROTOS)
	$(PBTS) -o src/lib/proto/dmcn.d.ts src/lib/proto/dmcn.js

# proto regenerates the Go bindings (dmcnpb) from the core schema. Requires the buf CLI.
proto:
	buf generate

test:
	go test ./... -timeout 120s

test-cover:
	go test ./... -cover -timeout 120s

vet:
	go vet ./...

lint: vet
	buf lint

# tidy runs go mod tidy (use GOWORK=off if resolving the published module).
tidy:
	go mod tidy

clean:
	rm -rf bin/ $(WEB)/dist $(WEB)/node_modules coverage*.txt
