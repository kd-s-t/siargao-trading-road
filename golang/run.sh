#!/bin/bash
cd "$(dirname "$0")"
lsof -ti:3020 | xargs kill -9 2>/dev/null || true
go build -o server main.go
if [ $? -eq 0 ]; then
  ./server
else
  echo "Build failed"
  exit 1
fi


