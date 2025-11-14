import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser, info: unknown, context: ExecutionContext): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const traceId = (request.headers['x-request-id'] as string) || this.generateTraceId();
      
      throw new UnauthorizedException({
        type: 'https://errors.bthwani.com/common/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'DSH-401-UNAUTHORIZED',
        detail: 'Invalid or missing authentication token',
        traceId,
      });
    }
    return user;
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
