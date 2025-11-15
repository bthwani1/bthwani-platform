import { Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdempotencyRepository } from '../repositories/idempotency.repository';
import { IdempotencyEntity } from '../entities/idempotency.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { createHash } from 'crypto';

export interface CheckIdempotencyRequest {
  idempotencyKey: string;
  operation: string;
  requestBody?: unknown;
}

export interface StoreIdempotencyRequest {
  idempotencyKey: string;
  operation: string;
  requestBody?: unknown;
  response?: unknown;
  statusCode?: number;
}

@Injectable()
export class IdempotencyService {
  private readonly ttlHours: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly idempotencyRepository: IdempotencyRepository,
    private readonly logger: LoggerService,
  ) {
    this.ttlHours = this.configService.get<number>('VAR_IDEMPOTENCY_TTL_HOURS', 24);
  }

  async checkIdempotency(request: CheckIdempotencyRequest): Promise<IdempotencyEntity | null> {
    const { idempotencyKey, operation, requestBody } = request;

    const existing = await this.idempotencyRepository.findByKey(idempotencyKey);
    if (!existing) {
      return null;
    }

    if (existing.operation !== operation) {
      throw new ConflictException(
        `Idempotency key mismatch: expected ${operation}, got ${existing.operation}`,
      );
    }

    if (existing.expires_at < new Date()) {
      return null;
    }

    const requestHash = this.computeRequestHash(requestBody);
    if (existing.request_hash !== requestHash) {
      throw new ConflictException('Idempotency key request mismatch');
    }

    this.logger.log('Idempotency hit', {
      idempotencyKey,
      operation,
    });

    return existing;
  }

  async storeIdempotency(request: StoreIdempotencyRequest): Promise<IdempotencyEntity> {
    const { idempotencyKey, operation, requestBody, response, statusCode } = request;

    const existing = await this.idempotencyRepository.findByKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.ttlHours);

    const entity = new IdempotencyEntity();
    entity.idempotency_key = idempotencyKey;
    entity.operation = operation;
    entity.request_hash = this.computeRequestHash(requestBody);
    if (response !== undefined) {
      entity.response = response as Record<string, unknown>;
    }
    if (statusCode !== undefined) {
      entity.status_code = statusCode;
    }
    entity.expires_at = expiresAt;

    const created = await this.idempotencyRepository.create(entity);

    this.logger.log('Idempotency stored', {
      idempotencyKey,
      operation,
      expiresAt: expiresAt.toISOString(),
    });

    return created;
  }

  async cleanupExpired(): Promise<number> {
    return this.idempotencyRepository.deleteExpired();
  }

  private computeRequestHash(requestBody: unknown): string {
    const data = JSON.stringify(requestBody || {});
    return createHash('sha256').update(data).digest('hex');
  }
}
