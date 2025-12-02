# Production Dockerfile for Siargao Trading Road Next.js App
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY nextjs/package.json ./
COPY nextjs/package-lock.json* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy Next.js source code
COPY nextjs/ ./

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_DOWNLOAD_URL

# Set environment variables for build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_DOWNLOAD_URL=${NEXT_PUBLIC_APP_DOWNLOAD_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy custom server
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json

# Install server dependencies (http-proxy-middleware for custom server)
RUN npm install --production --ignore-scripts http-proxy-middleware

USER nextjs

EXPOSE 3021

ENV PORT=3021
ENV HOSTNAME="0.0.0.0"

# Use custom server
CMD ["node", "server.js"]

