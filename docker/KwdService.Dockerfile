# KWD Service (KoWADER) Dockerfile
# Multi-stage build for production-ready container

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:18-alpine AS deps

LABEL maintainer="BThwani Engineering <support@bthwani.com>"
LABEL service="SRV-KWD-01"
LABEL version="1.0.0"

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ========================================
# Stage 2: Builder
# ========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY mikro-orm.config.ts ./

# Build application
RUN npm run build

# ========================================
# Stage 3: Runtime
# ========================================
FROM node:18-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set timezone to Asia/Aden
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Aden /etc/localtime && \
    echo "Asia/Aden" > /etc/timezone && \
    apk del tzdata

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/mikro-orm.config.ts ./

# Copy migrations
COPY --chown=nestjs:nodejs migrations/ ./migrations/

# Health check script
COPY --chown=nestjs:nodejs scripts/ci/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD /healthcheck.sh || exit 1

# Environment variables (defaults)
ENV NODE_ENV=production \
    SERVICE_NAME=kwd \
    HTTP_PORT=3000 \
    TZ=Asia/Aden

# Start application
CMD ["node", "dist/main"]

