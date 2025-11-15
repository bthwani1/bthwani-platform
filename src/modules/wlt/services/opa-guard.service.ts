import { Injectable } from '@nestjs/common';
import { ConfigService } from './config.service';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class OpaGuardService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async canExportUnmasked(userId: string, userRole: string): Promise<boolean> {
    const allowedRoles = ['admin', 'finance', 'hr'];
    if (!allowedRoles.includes(userRole)) {
      return false;
    }

    const sensitiveMode = await this.configService.getConfig({ key: 'VAR_SENSITIVE_MODE_ENABLED' });
    if (sensitiveMode && sensitiveMode.value === 'true') {
      return false;
    }

    return true;
  }

  async requiresStepUp(operation: string, userId: string, userRole: string): Promise<boolean> {
    const stepUpRequiredOperations = ['settlement_approve', 'config_update', 'export_unmasked'];

    if (!stepUpRequiredOperations.includes(operation)) {
      return false;
    }

    return true;
  }

  async checkRoleScope(role: string, resource: string, action: string): Promise<boolean> {
    const roleScopes: Record<string, string[]> = {
      user: ['account:read', 'transaction:read'],
      partner: ['account:read', 'transaction:read', 'settlement:read'],
      captain: ['account:read', 'transaction:read', 'cod:read'],
      support: ['account:read', 'transaction:read'],
      admin: ['*'],
      finance: ['*'],
      hr: ['export:read'],
    };

    const allowedActions = roleScopes[role] || [];
    if (allowedActions.includes('*')) {
      return true;
    }

    const requiredPermission = `${resource}:${action}`;
    return allowedActions.includes(requiredPermission);
  }
}
