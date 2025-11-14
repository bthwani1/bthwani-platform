import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  timestamp: string;
  requestId: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | T> {
    const request = context.switchToHttp().getRequest();
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    const url = request.url;

    // Skip transformation for health endpoints and Swagger docs
    if (url.startsWith('/api/health') || url.startsWith('/api/docs')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped or is a ProblemResponse, return as-is
        if (data && typeof data === 'object' && ('type' in data || 'data' in data)) {
          return data;
        }

        return {
          data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
