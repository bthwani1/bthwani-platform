import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const RequiresStepUp = () => SetMetadata('requiresStepUp', true);

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresStepUp = this.reflector.get<boolean>('requiresStepUp', context.getHandler());

    if (!requiresStepUp) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (
      request as unknown as {
        user?: { stepUpVerified?: boolean; stepUpTimestamp?: number };
      }
    ).user;

    if (!user) {
      throw new UnauthorizedException({
        type: 'https://api.bthwani.com/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Authentication required',
      });
    }

    // Check if step-up was verified within last 5 minutes (300 seconds)
    const stepUpWindow = 300 * 1000; // 5 minutes in milliseconds
    const now = Date.now();
    const stepUpTimestamp = user.stepUpTimestamp || 0;

    if (!user.stepUpVerified || now - stepUpTimestamp > stepUpWindow) {
      throw new UnauthorizedException({
        type: 'https://api.bthwani.com/problems/step-up-required',
        title: 'Step-Up Authentication Required',
        status: 401,
        code: 'STEP_UP_REQUIRED',
        detail: 'This operation requires step-up authentication',
      });
    }

    return true;
  }
}
