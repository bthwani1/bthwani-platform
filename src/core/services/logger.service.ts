import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggerService extends Logger {
  override log(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...logContext,
    };
    super.log(JSON.stringify(logEntry));
  }

  override error(message: string, trace?: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: trace,
      ...logContext,
    };
    super.error(JSON.stringify(logEntry), trace);
  }

  override warn(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...logContext,
    };
    super.warn(JSON.stringify(logEntry));
  }

  override debug(message: string, context?: string | LogContext): void {
    const logContext = typeof context === 'string' ? { context } : context;
    const logEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...logContext,
    };
    super.debug(JSON.stringify(logEntry));
  }
}
