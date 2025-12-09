#!/bin/bash
cd "$(dirname "$0")"
lsof -ti:3020 | xargs kill -9 2>/dev/null || true

if command -v air &> /dev/null; then
  air
else
  echo "Installing air for auto-compilation..."
  go install github.com/cosmtrek/air@latest
  if [ $? -eq 0 ]; then
    air
  else
    echo "Failed to install air, falling back to manual build"
    go build -o server main.go
    if [ $? -eq 0 ]; then
      ./server
    else
      echo "Build failed"
      exit 1
    fi
  fi
fi


