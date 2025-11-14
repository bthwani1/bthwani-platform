# Quick Start Guide - BThwani Platform DSH Service

## ✅ Build Status

The application **builds successfully**! All TypeScript code compiles without errors.

## 🚀 Running the Application

### Prerequisites

1. **Node.js 18+** (LTS recommended)
2. **PostgreSQL 12+** (for database)
3. **Environment variables** configured

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Create a `.env` file based on `.env.example`:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET or JWT_PUBLIC_KEY
```

### Step 3: Set Up Database (Optional for first run)

If you have PostgreSQL running:

```bash
# Create database
createdb bthwani_dsh

# Run migrations
npm run migration:up
```

**Note**: The application will start even without database, but database-dependent endpoints will fail.

### Step 4: Start Development Server

```bash
npm run start:dev
```

The server will start on `http://localhost:3000` (or port specified in `HTTP_PORT`).

### Step 5: Verify It's Running

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health/live
# Expected: {"status":"ok"}

# Swagger UI (no auth required)
# Open in browser: http://localhost:3000/api/docs
```

## 📍 Available Endpoints

### Public Endpoints (No Authentication)

- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe (checks database)
- `GET /api/docs` - Swagger UI documentation

### Protected Endpoints (Require JWT Bearer Token)

#### Orders (Customers)
- `POST /api/dls/orders` - Create order (requires Idempotency-Key header)
- `GET /api/dls/orders` - List orders
- `GET /api/dls/orders/:order_id` - Get order details

#### Captains
- `GET /api/dls/captains/me` - Get captain profile
- `GET /api/dls/captains/orders` - List assigned orders
- `PATCH /api/dls/captains/orders/:order_id/accept` - Accept order
- `PATCH /api/dls/captains/orders/:order_id/pickup` - Mark as picked up
- `PATCH /api/dls/captains/orders/:order_id/deliver` - Mark as delivered

#### Partners
- `GET /api/dls/partners/me` - Get partner profile
- `GET /api/dls/partners/orders` - List partner orders
- `POST /api/dls/partners/orders/:order_id/prepare` - Start preparation
- `POST /api/dls/partners/orders/:order_id/ready` - Mark as ready

#### Customers
- `GET /api/dls/customers/me` - Get customer profile
- `PATCH /api/dls/customers/me` - Update profile
- `GET /api/dls/customers/addresses` - List addresses
- `GET /api/dls/customers/preferences` - Get preferences

## 🔐 Authentication

All endpoints (except health and docs) require JWT Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Idempotency-Key: uuid-v4-key" \
     http://localhost:3000/api/dls/orders
```

## 🏗️ Build Output

The application builds to `dist/` directory:

```
dist/
  ├── main.js              # Entry point
  ├── app.module.js        # Root module
  ├── core/                # Core infrastructure
  ├── modules/
  │   └── dsh/             # DSH service
  └── shared/              # Shared services
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## ⚠️ Troubleshooting

### Database Connection Errors

If you see database connection errors:
1. Ensure PostgreSQL is running
2. Check `.env` file has correct DB credentials
3. Verify database exists: `createdb bthwani_dsh`
4. Run migrations: `npm run migration:up`

### JWT Authentication Errors

If authentication fails:
1. Ensure `JWT_SECRET` or `JWT_PUBLIC_KEY` is set in `.env`
2. Verify token is valid and not expired
3. Check token includes required claims (`sub`, `roles`)

### Port Already in Use

If port 3000 is busy:
```bash
# Set different port
export HTTP_PORT=3001
npm run start:dev
```

## 📚 Next Steps

1. Set up PostgreSQL database
2. Configure JWT keys (generate RSA key pair for production)
3. Run migrations to create tables
4. Test endpoints using Swagger UI
5. Configure external services (WLT, Catalog) URLs

## 🎉 Success!

If you see the build succeed and the server starts, you're ready to develop!

