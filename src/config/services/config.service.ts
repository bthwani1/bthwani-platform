import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigRepository } from '../repositories/config.repository';
import { RuntimeConfigEntity } from '../entities/runtime-config.entity';
import { isPlaceholder, CRITICAL_CONFIG_KEYS } from '../env.schema';

/**
 * Enhanced configuration service with control panel support
 * Priority: Control Panel (Database) > Environment Variables > Defaults
 */
@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly logger = new Logger(ConfigService.name);
  private runtimeConfigCache: Map<string, any> = new Map();
  private cacheInitialized = false;

  constructor(
    private readonly nestConfigService: NestConfigService,
    private readonly configRepository: ConfigRepository,
  ) {}

  /**
   * Initialize runtime config cache on module init
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.loadRuntimeConfig();
      this.logger.log('Runtime configuration cache initialized');
    } catch (error) {
      this.logger.error('Failed to initialize runtime configuration', error);
      // Don't throw - allow app to start with env vars only
    }
  }

  /**
   * Get configuration value with priority:
   * 1. Control Panel (Database)
   * 2. Environment Variables
   * 3. Defaults from schema
   */
  get<T = any>(key: string): T | undefined {
    // 1. Check runtime config (control panel)
    if (this.runtimeConfigCache.has(key)) {
      return this.runtimeConfigCache.get(key) as T;
    }

    // 2. Check environment variables
    const envValue = this.nestConfigService.get<T>(key);
    if (envValue !== undefined) {
      return envValue;
    }

    // 3. Return undefined (defaults handled by schema validation)
    return undefined;
  }

  /**
   * Get configuration value or throw if not found
   */
  getOrThrow<T = any>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' is required but not set`);
    }
    return value;
  }

  /**
   * Get configuration value with default fallback
   */
  getOrDefault<T = any>(key: string, defaultValue: T): T {
    return this.get<T>(key) ?? defaultValue;
  }

  /**
   * Check if configuration key exists
   */
  has(key: string): boolean {
    return (
      this.runtimeConfigCache.has(key) ||
      this.nestConfigService.get(key) !== undefined
    );
  }

  /**
   * Load runtime configuration from database
   */
  async loadRuntimeConfig(): Promise<void> {
    try {
      const configs = await this.configRepository.findAllActive();
      this.runtimeConfigCache.clear();

      for (const config of configs) {
        const parsedValue = this.parseValue(config.value, config.type);
        this.runtimeConfigCache.set(config.key, parsedValue);
      }

      this.cacheInitialized = true;
      this.logger.debug(`Loaded ${configs.length} runtime configurations`);
    } catch (error) {
      this.logger.warn('Failed to load runtime config, using environment only', error);
    }
  }

  /**
   * Update configuration from control panel
   */
  async updateConfig(
    key: string,
    value: string | number | boolean | object,
    options?: {
      description?: string;
      isSensitive?: boolean;
      updatedBy?: string;
    },
  ): Promise<RuntimeConfigEntity> {
    const isPlaceholderValue = this.checkIfPlaceholder(value);

    const config = await this.configRepository.upsert(key, value, {
      isPlaceholder: isPlaceholderValue,
      isSensitive: options?.isSensitive ?? false,
      description: options?.description,
      updatedBy: options?.updatedBy,
    });

    // Update cache
    const parsedValue = this.parseValue(config.value, config.type);
    this.runtimeConfigCache.set(key, parsedValue);

    this.logger.log(`Configuration '${key}' updated from control panel`);
    return config;
  }

  /**
   * Delete configuration (soft delete)
   */
  async deleteConfig(key: string): Promise<void> {
    await this.configRepository.delete(key);
    this.runtimeConfigCache.delete(key);
    this.logger.log(`Configuration '${key}' deleted`);
  }

  /**
   * Get all configurations (for admin panel)
   */
  async getAllConfigs(): Promise<RuntimeConfigEntity[]> {
    return this.configRepository.findAllActive();
  }

  /**
   * Get placeholder configurations that need to be set
   */
  async getPlaceholders(): Promise<RuntimeConfigEntity[]> {
    return this.configRepository.findPlaceholders();
  }

  /**
   * Validate critical configurations are not placeholders
   */
  validateCriticalConfigs(): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const key of CRITICAL_CONFIG_KEYS) {
      const value = this.get<string>(key);
      if (!value || isPlaceholder(value)) {
        missing.push(key);
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  /**
   * Parse value based on type
   */
  private parseValue(
    value: string | null,
    type: 'string' | 'number' | 'boolean' | 'json' | null,
  ): any {
    if (value === null) {
      return null;
    }

    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case 'string':
      default:
        return value;
    }
  }

  /**
   * Check if value is a placeholder
   */
  private checkIfPlaceholder(value: any): boolean {
    if (typeof value === 'string') {
      return isPlaceholder(value);
    }
    return false;
  }

  /**
   * Check if cache is initialized
   */
  isCacheInitialized(): boolean {
    return this.cacheInitialized;
  }
}

