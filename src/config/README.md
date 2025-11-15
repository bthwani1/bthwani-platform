# Configuration Module

Enhanced configuration management system with control panel support for runtime configuration updates.

## Features

- ✅ **Environment Variable Validation** with Joi schema
- ✅ **Placeholder Detection** for critical configurations
- ✅ **Runtime Configuration** via database (control panel managed)
- ✅ **Priority System**: Control Panel > Environment > Defaults
- ✅ **Validation Guards** to prevent placeholder usage in production
- ✅ **Admin API** for configuration management

## Architecture

### Priority Order

1. **Control Panel (Database)** - Runtime configurations stored in `runtime_config` table
2. **Environment Variables** - From `.env` files
3. **Default Values** - From schema defaults

### Configuration Flow

```
Request → ConfigService.get(key)
  ↓
Check runtime_config cache (Control Panel)
  ↓ (if not found)
Check environment variables
  ↓ (if not found)
Return undefined (schema validation handles defaults)
```

## Usage

### Basic Usage

```typescript
import { ConfigService } from './config/services/config.service';

@Injectable()
export class MyService {
  constructor(private readonly config: ConfigService) {}

  getJwtIssuer(): string {
    return this.config.getOrThrow<string>('JWT_ISSUER');
  }

  getMaxLoginAttempts(): number {
    return this.config.getOrDefault<number>('MAX_LOGIN_ATTEMPTS', 5);
  }
}
```

### Using Validation Guard

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { ConfigValidationGuard } from './config/guards/config-validation.guard';

@Controller('api/sensitive')
@UseGuards(ConfigValidationGuard)
export class SensitiveController {
  // This route will fail if critical configs are placeholders
}
```

### Admin Control Panel API

#### Get All Configurations
```http
GET /api/admin/config
Authorization: Bearer <token>
```

#### Get Placeholders
```http
GET /api/admin/config/placeholders
Authorization: Bearer <token>
```

#### Update Configuration
```http
PUT /api/admin/config/JWT_ISSUER
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "https://api.bthwani.com",
  "description": "JWT token issuer",
  "isSensitive": false,
  "updatedBy": "admin-user-id"
}
```

#### Validate Critical Configs
```http
GET /api/admin/config/validation
Authorization: Bearer <token>
```

## Placeholders

### Critical Placeholders (Must be set)

- `JWT_ISSUER` - JWT token issuer
- `JWT_PUBLIC_KEY` - JWT public key for verification
- `WEBHOOK_SECRET` - HMAC secret for webhook signing

### Feature Flags (Optional)

- `FEATURE_ENABLE_2FA` - Enable two-factor authentication
- `FEATURE_ENABLE_RATE_LIMIT` - Enable rate limiting
- `FEATURE_ENABLE_WEBHOOK` - Enable webhook notifications

### Governance Settings

- `MAX_LOGIN_ATTEMPTS` - Maximum login attempts before lockout
- `SESSION_TIMEOUT_MINUTES` - Session timeout duration
- `PASSWORD_MIN_LENGTH` - Minimum password length
- `DATA_RETENTION_DAYS` - Data retention period

## Migration

Run the migration to create the `runtime_config` table:

```bash
npm run migration:up
```

## Security

- Sensitive configurations are marked with `isSensitive: true`
- Placeholders are automatically detected and flagged
- Validation guards prevent production use with placeholders
- All configuration updates are logged with `updatedBy`

## Environment Variables

See `src/config/env.schema.ts` for complete list of supported environment variables with validation rules.

