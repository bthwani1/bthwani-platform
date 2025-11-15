# Configuration Module Installation

## Prerequisites

⚠️ **IMPORTANT**: `joi` package is required but not yet installed. Install it before using the ConfigModule:

```bash
npm install joi
npm install --save-dev @types/joi
```

This is a required dependency for environment variable validation.

## Steps

### 1. Install Dependencies

```bash
npm install joi
npm install --save-dev @types/joi
```

### 2. Run Migration

Create and run the migration for `runtime_config` table:

```bash
npm run migration:up
```

### 3. Verify Installation

Check that the ConfigModule is properly imported in `app.module.ts`:

```typescript
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule, // Should be first
    // ... other modules
  ],
})
```

### 4. Environment Variables

Create or update `.env` file with placeholders:

```env
# Core
NODE_ENV=development
SERVICE_NAME=bthwani-platform
HTTP_PORT=3000

# Database
DB_URL=postgresql://localhost:5432/bthwani_dev
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security - PLACEHOLDERS (configure from control panel)
JWT_ISSUER=PLACEHOLDER_JWT_ISSUER
JWT_PUBLIC_KEY=PLACEHOLDER_JWT_PUBLIC_KEY
WEBHOOK_SECRET=PLACEHOLDER_WEBHOOK_SECRET

# Feature Flags
FEATURE_ENABLE_2FA=false
FEATURE_ENABLE_RATE_LIMIT=true
```

### 5. Configure from Control Panel

After deployment, configure critical settings via admin API:

```bash
# Set JWT Issuer
curl -X PUT http://localhost:3000/api/admin/config/JWT_ISSUER \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "https://api.bthwani.com",
    "description": "JWT token issuer",
    "isSensitive": false
  }'
```

## Verification

1. Check that app starts without errors
2. Verify `/api/admin/config/placeholders` returns list of placeholders
3. Verify `/api/admin/config/validation` shows missing critical configs
4. Configure placeholders from control panel
5. Verify validation passes after configuration

