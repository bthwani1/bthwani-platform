import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PartnerRoleService } from '../../modules/partner/services/partner-role.service';

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata('permission', { resource, action });

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly roleService: PartnerRoleService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<{ resource: string; action: string }>(
      'permission',
      context.getHandler(),
    );

    if (!permission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as { user?: { roles?: string[] } }).user;

    if (!user || !user.roles) {
      throw new ForbiddenException({
        type: 'https://api.bthwani.com/problems/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Authentication required',
      });
    }

    const hasPermission = this.roleService.hasPermission(
      user.roles,
      permission.resource,
      permission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        type: 'https://api.bthwani.com/problems/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: `Permission denied: ${permission.resource}:${permission.action}`,
      });
    }

    return true;
  }
}

