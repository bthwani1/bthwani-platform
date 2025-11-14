import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as { user?: { roles?: string[] } }).user;

    if (!user) {
      throw new UnauthorizedException({
        type: 'https://api.bthwani.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Authentication required',
      });
    }

    const userRoles = user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException({
        type: 'https://api.bthwani.com/problems/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: `Required roles: ${requiredRoles.join(', ')}`,
      });
    }

    return true;
  }
}
