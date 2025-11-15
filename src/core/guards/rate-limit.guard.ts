import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export interface RateLimitOptions {
  ttl: number;
  limit: number;
  keyGenerator?: (request: Request) => string;
}

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (options: RateLimitOptions) => {
  return (target: unknown, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    }
    return descriptor;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = rateLimitOptions.keyGenerator
      ? rateLimitOptions.keyGenerator(request)
      : this.defaultKeyGenerator(request);

    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + rateLimitOptions.ttl * 1000,
      });
      this.cleanup();
      return true;
    }

    if (record.count >= rateLimitOptions.limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        {
          type: 'https://errors.bthwani.com/common/rate_limit_exceeded',
          title: 'Rate Limit Exceeded',
          status: 429,
          code: 'ESF-429-RATE-LIMIT-EXCEEDED',
          detail: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          traceId: (request.headers['x-request-id'] as string) || 'unknown',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private defaultKeyGenerator(request: Request): string {
    const user = (request as unknown as { user?: { sub?: string } }).user;
    const userId = user?.sub || request.ip;
    const route = request.route?.path || request.path;
    return `rate_limit:${route}:${userId}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}
