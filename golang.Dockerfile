# Production Dockerfile for Siargao Trading Road Go API
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY golang/go.mod golang/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code (ensure assets are included)
COPY golang/ ./

# Verify the embed file exists before building
RUN test -f handlers/assets/splash.png || (echo "ERROR: handlers/assets/splash.png not found!" && find . -name "splash.png" && exit 1)

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o main .

# Build the seed/migration binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o seed ./cmd/seed

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binaries from builder
COPY --from=builder /app/main .
COPY --from=builder /app/seed .

# Expose port
EXPOSE 3020

# Run the binary
CMD ["./main"]

