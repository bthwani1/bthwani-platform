import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor to handle TRACE method requests and add Allow header
 * as per RFC7231 compliance requirements
 */
@Injectable()
export class TraceInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Handle TRACE method requests
    if (request.method === 'TRACE') {
      // Set Allow header with allowed HTTP methods for this endpoint
      const allowedMethods = this.getAllowedMethods(context, request);
      response.setHeader('Allow', allowedMethods.join(', '));
      response.setHeader('Content-Type', 'message/http');
      
      // Return TRACE response as per RFC7231
      return new Observable((observer) => {
        try {
          const traceResponse = `${request.method} ${request.url} HTTP/1.1\r\n${this.formatHeaders(request.headers)}\r\n`;
          response.status(200).send(traceResponse);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      });
    }

    // For non-TRACE requests, add Allow header if not already set
    return next.handle().pipe(
      tap(() => {
        if (!response.getHeader('Allow')) {
          const allowedMethods = this.getAllowedMethods(context, request);
          response.setHeader('Allow', allowedMethods.join(', '));
        }
      }),
    );
  }

  private getAllowedMethods(context: ExecutionContext, request: Request): string[] {
    // Try to extract allowed methods from route metadata
    const handler = context.getHandler();
    const controller = context.getClass();
    
    // Check for custom metadata that might specify allowed methods
    const routeMethods = this.reflector.get<string[]>('httpMethods', handler) ||
                        this.reflector.get<string[]>('httpMethods', controller);
    
    if (routeMethods && routeMethods.length > 0) {
      // Add standard methods that are always allowed
      const standardMethods = ['OPTIONS', 'HEAD'];
      return [...new Set([...routeMethods, ...standardMethods])].sort();
    }
    
    // Extract from route path patterns
    const path = request.route?.path || request.url;
    
    // Determine methods based on common REST patterns
    if (path.includes('/orders') || path.includes('/captains') || path.includes('/partners')) {
      // REST endpoints typically support GET, POST, PUT, PATCH, DELETE
      return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
    }
    
    if (path.startsWith('/api/health')) {
      // Health endpoints are read-only
      return ['GET', 'OPTIONS', 'HEAD'];
    }
    
    // Default allowed methods for REST endpoints
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  }

  private formatHeaders(headers: Record<string, unknown>): string {
    return Object.entries(headers)
      .filter(([key]) => {
        // Exclude headers that shouldn't be in TRACE response per RFC7231
        const excludedHeaders = ['host', 'connection', 'content-length', 'transfer-encoding'];
        return !excludedHeaders.includes(key.toLowerCase());
      })
      .map(([key, value]) => {
        const headerValue = Array.isArray(value) ? value.join(', ') : String(value);
        return `${key}: ${headerValue}`;
      })
      .join('\r\n');
  }
}

