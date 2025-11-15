import * as Joi from 'joi';

/**
 * Environment variables validation schema with placeholders
 * Placeholders will be replaced/configured from admin control panel
 */
export const envSchema = Joi.object({
  // Core Application
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development')
    .description('Application environment'),
  SERVICE_NAME: Joi.string()
    .default('bthwani-platform')
    .description('Service identifier'),
  HTTP_PORT: Joi.number().integer().min(1).max(65535).default(3000).description('HTTP server port'),

  // Database Configuration
  DB_URL: Joi.string()
    .uri()
    .default('postgresql://localhost:5432/bthwani_dev')
    .description('Database connection URL'),
  DB_HOST: Joi.string().default('localhost').description('Database host'),
  DB_PORT: Joi.number().integer().default(5432).description('Database port'),
  DB_USER: Joi.string().default('postgres').description('Database user'),
  DB_PASSWORD: Joi.string().default('postgres').description('Database password'),
  DB_NAME: Joi.string().default('bthwani_dev').description('Database name'),
  DB_POOL_MIN: Joi.number().integer().min(1).default(2).description('Database pool minimum connections'),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10).description('Database pool maximum connections'),

  // Cache Configuration
  CACHE_URL: Joi.string()
    .uri()
    .optional()
    .default('redis://localhost:6379')
    .description('Cache/Redis connection URL'),

  // Queue Configuration
  QUEUE_URL: Joi.string()
    .uri()
    .optional()
    .default('redis://localhost:6379')
    .description('Queue/Redis connection URL'),

  // JWT Authentication - PLACEHOLDERS (Control Panel Managed)
  JWT_ISSUER: Joi.string()
    .default('PLACEHOLDER_JWT_ISSUER')
    .description('JWT token issuer (must be configured from control panel)'),
  JWT_PUBLIC_KEY: Joi.string()
    .default('PLACEHOLDER_JWT_PUBLIC_KEY')
    .description('JWT public key (must be configured from control panel)'),
  JWT_SECRET: Joi.string()
    .optional()
    .default('PLACEHOLDER_JWT_SECRET')
    .description('JWT secret for HS256 (must be configured from control panel)'),
  JWT_ALG: Joi.string()
    .valid('RS256', 'HS256')
    .default('RS256')
    .description('JWT algorithm'),

  // Webhook Security - PLACEHOLDERS (Control Panel Managed)
  WEBHOOK_SECRET: Joi.string()
    .default('PLACEHOLDER_WEBHOOK_SECRET')
    .description('Webhook HMAC secret (must be configured from control panel)'),
  HMAC_ALG: Joi.string()
    .valid('sha256', 'sha512')
    .default('sha256')
    .description('HMAC algorithm for webhook signing'),

  // Feature Flags - PLACEHOLDERS (Control Panel Managed)
  FEATURE_ENABLE_2FA: Joi.boolean().default(false).description('Enable two-factor authentication'),
  FEATURE_ENABLE_RATE_LIMIT: Joi.boolean().default(true).description('Enable rate limiting'),
  FEATURE_ENABLE_WEBHOOK: Joi.boolean().default(false).description('Enable webhook notifications'),
  FEATURE_ENABLE_AUDIT_LOG: Joi.boolean().default(true).description('Enable audit logging'),

  // Governance Settings - PLACEHOLDERS (Control Panel Managed)
  MAX_LOGIN_ATTEMPTS: Joi.number()
    .integer()
    .min(3)
    .max(10)
    .default(5)
    .description('Maximum login attempts before lockout'),
  SESSION_TIMEOUT_MINUTES: Joi.number()
    .integer()
    .min(5)
    .max(1440)
    .default(30)
    .description('Session timeout in minutes'),
  PASSWORD_MIN_LENGTH: Joi.number()
    .integer()
    .min(8)
    .max(128)
    .default(8)
    .description('Minimum password length'),
  DATA_RETENTION_DAYS: Joi.number()
    .integer()
    .min(30)
    .max(3650)
    .default(365)
    .description('Data retention period in days'),

  // Rate Limiting - PLACEHOLDERS (Control Panel Managed)
  RATE_LIMIT_TTL_SECONDS: Joi.number()
    .integer()
    .min(1)
    .default(60)
    .description('Rate limit time window in seconds'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .integer()
    .min(1)
    .default(100)
    .description('Maximum requests per time window'),

  // Security Headers - PLACEHOLDERS (Control Panel Managed)
  CSP_NONCE_ENABLED: Joi.boolean().default(true).description('Enable CSP nonce'),
  HSTS_MAX_AGE: Joi.number()
    .integer()
    .min(0)
    .default(31536000)
    .description('HSTS max age in seconds'),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .description('Logging level'),
  LOG_FORMAT: Joi.string()
    .valid('json', 'text')
    .default('json')
    .description('Log format'),

  // Timezone
  TZ: Joi.string().default('Asia/Aden').description('Application timezone'),
}).unknown(false);

/**
 * List of configuration keys that must NOT be placeholders in production
 */
export const CRITICAL_CONFIG_KEYS = [
  'JWT_ISSUER',
  'JWT_PUBLIC_KEY',
  'WEBHOOK_SECRET',
] as const;

/**
 * Check if a value is a placeholder
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.startsWith('PLACEHOLDER_') || value === '';
}

/**
 * Default values map for quick access
 */
export const DEFAULT_VALUES: Record<string, any> = {
  NODE_ENV: 'development',
  SERVICE_NAME: 'bthwani-platform',
  HTTP_PORT: 3000,
  DB_URL: 'postgresql://localhost:5432/bthwani_dev',
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'bthwani_dev',
  DB_POOL_MIN: 2,
  DB_POOL_MAX: 10,
  CACHE_URL: 'redis://localhost:6379',
  QUEUE_URL: 'redis://localhost:6379',
  JWT_ISSUER: 'PLACEHOLDER_JWT_ISSUER',
  JWT_PUBLIC_KEY: 'PLACEHOLDER_JWT_PUBLIC_KEY',
  JWT_SECRET: 'PLACEHOLDER_JWT_SECRET',
  JWT_ALG: 'RS256',
  WEBHOOK_SECRET: 'PLACEHOLDER_WEBHOOK_SECRET',
  HMAC_ALG: 'sha256',
  FEATURE_ENABLE_2FA: false,
  FEATURE_ENABLE_RATE_LIMIT: true,
  FEATURE_ENABLE_WEBHOOK: false,
  FEATURE_ENABLE_AUDIT_LOG: true,
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT_MINUTES: 30,
  PASSWORD_MIN_LENGTH: 8,
  DATA_RETENTION_DAYS: 365,
  RATE_LIMIT_TTL_SECONDS: 60,
  RATE_LIMIT_MAX_REQUESTS: 100,
  CSP_NONCE_ENABLED: true,
  HSTS_MAX_AGE: 31536000,
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  TZ: 'Asia/Aden',
};

/**
 * Get default value for a config key
 */
export function getDefaultValue(key: string): any {
  return DEFAULT_VALUES[key];
}

