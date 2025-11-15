# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20.11.1-alpine

FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:${NODE_VERSION} AS production
WORKDIR /app
ENV NODE_ENV=production
ENV SERVICE_NAME=arb
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/arb/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "dist/main.js"]
