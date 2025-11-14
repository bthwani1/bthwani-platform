import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const idempotencyKey = request.headers['idempotency-key'] as string;

    // Only require idempotency key for unsafe methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!idempotencyKey) {
        throw new BadRequestException({
          type: 'https://api.bthwani.com/problems/missing-idempotency-key',
          title: 'Idempotency Key Required',
          status: 400,
          code: 'MISSING_IDEMPOTENCY_KEY',
          detail: 'Idempotency-Key header is required for this operation',
        });
      }

      // Validate format (UUID v4 recommended)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(idempotencyKey)) {
        throw new BadRequestException({
          type: 'https://api.bthwani.com/problems/invalid-idempotency-key',
          title: 'Invalid Idempotency Key Format',
          status: 400,
          code: 'INVALID_IDEMPOTENCY_KEY',
          detail: 'Idempotency-Key must be a valid UUID v4',
        });
      }
    }

    return true;
  }
}
