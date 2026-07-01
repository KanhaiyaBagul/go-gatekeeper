.PHONY: build test lint run-server run-client clean all

all: lint test build

build:
	@echo "==> Building CLI and Server..."
	go build -o bin/cli ./cmd/cli
	go build -o bin/server ./cmd/server
	@echo "==> Done!"

test:
	@echo "==> Running tests..."
	go test -v -race ./...

lint:
	@echo "==> Running linter..."
	golangci-lint run ./...

run-server:
	@echo "==> Starting Relay Server on port 8080..."
	go run ./cmd/server

run-client:
	@echo "==> Starting CLI Host..."
	go run ./cmd/cli host --server ws://localhost:8080/ws

clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf bin/
	@echo "==> Cleaned!"
