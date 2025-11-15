import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfRequestEntity, EsfRequestStatus } from '../entities/esf-request.entity';
import { CreateRequestDto } from '../dto/create-request.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { EsfMatchingService } from './esf-matching.service';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import { EsfAuditLogger } from './esf-audit-logger.service';

@Injectable()
export class EsfRequestService {
  constructor(
    private readonly requestRepository: EsfRequestRepository,
    private readonly matchingService: EsfMatchingService,
    private readonly notificationAdapter: EsfNotificationAdapter,
    private readonly auditLogger: EsfAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async createRequest(
    createDto: CreateRequestDto,
    requesterId: string,
    idempotencyKey: string,
  ): Promise<EsfRequestEntity> {
    const existing = await this.requestRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.log('Idempotent request creation', {
        idempotencyKey,
        requestId: existing.id,
      });
      return existing;
    }

    const request = new EsfRequestEntity();
    request.requester_id = requesterId;
    request.patient_name = createDto.patient_name;
    request.hospital_name = createDto.hospital_name;
    request.city = createDto.city;
    request.district = createDto.district;
    request.hospital_address = createDto.hospital_address;
    request.location = createDto.location;
    request.abo_type = createDto.abo_type;
    request.rh_factor = createDto.rh_factor;
    request.notes = createDto.notes;
    request.idempotency_key = idempotencyKey;
    request.status = EsfRequestStatus.PENDING;

    const saved = await this.requestRepository.create(request);

    await this.auditLogger.log({
      entityType: 'request',
      entityId: saved.id,
      action: 'create_request',
      userId: requesterId,
      newValues: {
        patient_name: createDto.patient_name,
        hospital_name: createDto.hospital_name,
        city: createDto.city,
        abo_type: createDto.abo_type,
        rh_factor: createDto.rh_factor,
      },
    });

    await this.matchingService.matchRequest(saved.id);

    return saved;
  }

  async getRequest(requestId: string, userId: string): Promise<EsfRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'ESF-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (request.requester_id !== userId) {
      const matches = await this.matchingService.getMatchesForRequest(requestId);
      const isMatchedDonor = matches.some((m) => m.donor_id === userId);
      if (!isMatchedDonor) {
        throw new NotFoundException({
          type: 'https://errors.bthwani.com/esf/request_not_found',
          title: 'Request Not Found',
          status: 404,
          code: 'ESF-404-REQUEST-NOT-FOUND',
          detail: `Request ${requestId} not found`,
        });
      }
    }

    return request;
  }

  async listRequests(
    requesterId: string,
    options?: { cursor?: string; limit?: number; status?: EsfRequestStatus },
  ): Promise<{ items: EsfRequestEntity[]; nextCursor?: string }> {
    const requests = await this.requestRepository.findByRequester(requesterId, options);

    const hasMore = options?.limit && requests.length > options.limit;
    const items = hasMore ? requests.slice(0, options.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async cancelRequest(requestId: string, requesterId: string): Promise<EsfRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'ESF-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (request.requester_id !== requesterId) {
      throw new ConflictException({
        type: 'https://errors.bthwani.com/esf/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ESF-403-UNAUTHORIZED',
        detail: 'Only the requester can cancel this request',
      });
    }

    if (
      request.status !== EsfRequestStatus.PENDING &&
      request.status !== EsfRequestStatus.MATCHED
    ) {
      throw new ConflictException({
        type: 'https://errors.bthwani.com/esf/invalid_status',
        title: 'Invalid Status',
        status: 409,
        code: 'ESF-409-INVALID-STATUS',
        detail: `Cannot cancel request in status ${request.status}`,
      });
    }

    request.status = EsfRequestStatus.CANCELLED;
    request.cancelled_at = new Date();
    await this.requestRepository.create(request);

    await this.auditLogger.log({
      entityType: 'request',
      entityId: requestId,
      action: 'cancel_request',
      userId: requesterId,
      oldValues: { status: request.status },
      newValues: { status: EsfRequestStatus.CANCELLED },
    });

    return request;
  }
}
