#!/bin/bash
cd "$(dirname "$0")"
go build -o server main.go
if [ $? -eq 0 ]; then
  ./server
else
  echo "Build failed"
  exit 1
fi


