#!/bin/bash
cd "$(dirname "$0")/.."
export PATH="$(go env GOPATH)/bin:$PATH"
lsof -ti:3020 | xargs kill -9 2>/dev/null || true

echo "Running database migrations..."
go run main.go migrate
if [ $? -ne 0 ]; then
  echo "Migration failed"
  exit 1
fi

if command -v air &> /dev/null; then
  air
else
  echo "Installing air for auto-compilation..."
  go install github.com/air-verse/air@latest
  if [ $? -eq 0 ]; then
    air
  else
    echo "Failed to install air, falling back to manual build"
    go build -o server .
    if [ $? -eq 0 ]; then
      ./server
    else
      echo "Build failed"
      exit 1
    fi
  fi
fi


