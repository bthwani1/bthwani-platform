import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

export interface ProblemResponse {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  traceId: string;
  errors?: Array<{ field?: string; message: string }> | undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let problem: ProblemResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        problem = {
          type: `https://errors.bthwani.com/${(exceptionResponse as { type?: string }).type || 'common/error'}`,
          title: (exceptionResponse as { message?: string }).message || exception.message,
          status,
          code: (exceptionResponse as { code?: string }).code || `HTTP-${status}`,
          detail: (exceptionResponse as { detail?: string }).detail || exception.message,
          traceId,
          errors: (exceptionResponse as { errors?: Array<{ field?: string; message: string }> })
            .errors,
        };
      } else {
        problem = {
          type: `https://errors.bthwani.com/common/http_error`,
          title: exception.message,
          status,
          code: `HTTP-${status}`,
          detail: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
          traceId,
        };
      }
    } else {
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

    response.status(status).json(problem);
  }
}
