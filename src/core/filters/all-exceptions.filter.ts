import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

export interface ProblemResponse {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  traceId: string;
  instance?: string;
  errors?: Array<{ field?: string; message: string }>;
}

/**
 * Generates RFC7807-compliant error code following pattern: {SERVICE}-{HTTP}-{KEY}
 * Pattern: ^[A-Z]{3}-[0-9]{3}-[A-Z0-9\-]+$
 */
function generateErrorCode(status: number, service: string = 'DSH', key?: string): string {
  const httpCode = status.toString().padStart(3, '0');
  const errorKey = key || 'ERROR';
  return `${service}-${httpCode}-${errorKey}`;
}

/**
 * Normalizes error type URI to RFC7807 format
 */
function normalizeErrorType(type: string | undefined, status: number): string {
  if (type && type.startsWith('https://')) {
    return type;
  }
  if (type && type.startsWith('http://')) {
    return type.replace('http://', 'https://');
  }
  // Map common error types
  const errorTypeMap: Record<number, string> = {
    400: 'bad_request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'not_found',
    409: 'conflict',
    422: 'validation_error',
    429: 'rate_limit_exceeded',
    500: 'unexpected_error',
    503: 'service_unavailable',
  };
  const errorType = errorTypeMap[status] || 'error';
  return `https://errors.bthwani.com/${errorType}`;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request.headers['x-request-id'] as string) || this.generateTraceId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let problem: ProblemResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as {
          type?: string;
          title?: string;
          message?: string;
          code?: string;
          detail?: string;
          errors?: Array<{ field?: string; message: string }>;
        };

        // Extract service code from existing code or generate new one
        let errorCode = responseObj.code;
        if (!errorCode || !/^[A-Z]{3}-[0-9]{3}-[A-Z0-9\-]+$/.test(errorCode)) {
          const key = errorCode?.replace(/^[A-Z]{3}-[0-9]{3}-/, '') || 'ERROR';
          errorCode = generateErrorCode(status, 'DSH', key.toUpperCase().replace(/[^A-Z0-9]/g, '-'));
        }

        problem = {
          type: normalizeErrorType(responseObj.type, status),
          title: responseObj.title || responseObj.message || exception.message || 'Error',
          status,
          code: errorCode,
          detail: responseObj.detail || responseObj.message || exception.message,
          traceId,
          ...(responseObj.errors && { errors: responseObj.errors }),
        };
      } else {
        // String response
        const message = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
        problem = {
          type: normalizeErrorType(undefined, status),
          title: exception.message || 'Error',
          status,
          code: generateErrorCode(status),
          detail: message,
          traceId,
        };
      }
    } else {
      // Unexpected error
      const errorMessage = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error('Unexpected error', errorMessage, {
        traceId,
        path: request.url,
        method: request.method,
      });
      problem = {
        type: 'https://errors.bthwani.com/common/unexpected_error',
        title: 'Unexpected error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'SVR-500-UNEXPECTED',
        detail: 'An unexpected error occurred. Please retry.',
        traceId,
      };
    }

    // Ensure all required fields are present per RFC7807
    if (!problem.traceId) {
      problem.traceId = this.generateTraceId();
    }
    if (!problem.code || !/^[A-Z]{3}-[0-9]{3}-[A-Z0-9\-]+$/.test(problem.code)) {
      problem.code = generateErrorCode(problem.status);
    }
    if (!problem.type || !problem.type.startsWith('https://')) {
      problem.type = normalizeErrorType(problem.type, problem.status);
    }
    if (!problem.title) {
      problem.title = 'Error';
    }
    if (!problem.status || problem.status < 100 || problem.status >= 600) {
      problem.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Set Content-Type header for RFC7807 compliance
    response.setHeader('Content-Type', 'application/problem+json');
    
    // Ensure status is set before sending response
    response.status(problem.status);
    
    // Send RFC7807-compliant problem response
    response.json(problem);
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
