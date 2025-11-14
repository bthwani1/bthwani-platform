import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly metricsService?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    const startTime = Date.now();

    this.logger.log(`${method} ${url}`, {
      traceId: requestId,
      method,
      url,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`${method} ${url} ${response.statusCode}`, {
            traceId: requestId,
            method,
            url,
            statusCode: response.statusCode,
            duration,
            ip,
          });
          const route = url.split('?')[0] || url;
          this.metricsService?.recordTiming('http.request.duration', duration, {
            method,
            status: response.statusCode.toString(),
            route,
          });
          this.metricsService?.recordCounter('http.requests.total', 1, {
            method,
            status: response.statusCode.toString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} ${response.statusCode || 500}`, error.stack, {
            traceId: requestId,
            method,
            url,
            statusCode: response.statusCode || 500,
            duration,
            ip,
            error: error.message,
          });
        },
      }),
    );
  }
}
