import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';

export enum PartnerRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  MARKETER = 'marketer',
}

export interface PartnerPermission {
  resource: string;
  action: string;
}

export const ROLE_PERMISSIONS: Record<PartnerRole, PartnerPermission[]> = {
  [PartnerRole.OWNER]: [
    { resource: 'finance', action: 'read' },
    { resource: 'settlements', action: 'read' },
    { resource: 'subscription', action: 'request' },
    { resource: 'store', action: 'update' },
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'update' },
    { resource: 'bookings', action: 'read' },
    { resource: 'bookings', action: 'update' },
    { resource: 'exports', action: 'create' },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
  ],
  [PartnerRole.MANAGER]: [
    { resource: 'orders', action: 'read' },
    { resource: 'orders', action: 'update' },
    { resource: 'bookings', action: 'read' },
    { resource: 'bookings', action: 'update' },
    { resource: 'store', action: 'update' },
    { resource: 'store', action: 'toggle' },
    { resource: 'profile', action: 'read' },
  ],
  [PartnerRole.CASHIER]: [
    { resource: 'finance', action: 'read' },
    { resource: 'exports', action: 'create' },
    { resource: 'settlements', action: 'read' },
  ],
  [PartnerRole.MARKETER]: [
    { resource: 'subscription', action: 'read' },
    { resource: 'promos', action: 'request' },
    { resource: 'profile', action: 'read' },
  ],
};

@Injectable()
export class PartnerRoleService {
  constructor(private readonly logger: LoggerService) {}

  hasPermission(roles: string[], resource: string, action: string): boolean {
    for (const role of roles) {
      const partnerRole = role as PartnerRole;
      if (partnerRole in ROLE_PERMISSIONS) {
        const permissions = ROLE_PERMISSIONS[partnerRole];
        if (
          permissions.some(
            (p) => p.resource === resource && p.action === action,
          )
        ) {
          return true;
        }
      }
    }
    return false;
  }

  getPermissions(roles: string[]): PartnerPermission[] {
    const allPermissions = new Map<string, PartnerPermission>();
    for (const role of roles) {
      const partnerRole = role as PartnerRole;
      if (partnerRole in ROLE_PERMISSIONS) {
        const permissions = ROLE_PERMISSIONS[partnerRole];
        for (const perm of permissions) {
          const key = `${perm.resource}:${perm.action}`;
          if (!allPermissions.has(key)) {
            allPermissions.set(key, perm);
          }
        }
      }
    }
    return Array.from(allPermissions.values());
  }

  requirePermission(roles: string[], resource: string, action: string): void {
    if (!this.hasPermission(roles, resource, action)) {
      throw new Error(
        `Permission denied: ${resource}:${action} for roles: ${roles.join(', ')}`,
      );
    }
  }
}

