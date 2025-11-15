import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../services/config.service';
import { CRITICAL_CONFIG_KEYS, isPlaceholder } from '../env.schema';

/**
 * Guard to validate that critical configurations are not placeholders
 * Use this guard on routes that require production-ready configuration
 */
@Injectable()
export class ConfigValidationGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip validation if cache is not initialized (e.g., during startup)
    if (!this.configService.isCacheInitialized()) {
      return true;
    }

    const validation = this.configService.validateCriticalConfigs();

    if (!validation.isValid) {
      const missingKeys = validation.missing.join(', ');
      throw new BadRequestException(
        `Critical configurations are not set or are placeholders: ${missingKeys}. ` +
          'Please configure these values from the admin control panel.',
      );
    }

    return true;
  }
}

/**
 * Decorator to mark routes that require non-placeholder configuration
 */
export const RequireValidConfig = () => {
  // This can be used with SetMetadata if needed
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    // Implementation can be extended
  };
};

