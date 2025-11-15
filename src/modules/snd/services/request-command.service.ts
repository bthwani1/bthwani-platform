import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { SndRequestRepository } from '../repositories/request.repository';
import { SndCategoryRepository } from '../repositories/category.repository';
import { SndRequestEntity, SndRequestType, SndRequestStatus } from '../entities/request.entity';
import { CreateRequestDto } from '../dto/requests/create-request.dto';
import { UpdateRequestStatusDto } from '../dto/requests/update-request-status.dto';
import { PricingEngineService } from './pricing-engine.service';
import { RoutingEngineService } from './routing-engine.service';
import { SndWalletAdapter } from '../adapters/wallet.adapter';
import { SndNotificationAdapter } from '../adapters/notification.adapter';
import { SndAuditLogger } from './audit-logger.service';

@Injectable()
export class SndRequestCommandService {
  constructor(
    private readonly requestRepository: SndRequestRepository,
    private readonly categoryRepository: SndCategoryRepository,
    private readonly pricingEngine: PricingEngineService,
    private readonly routingEngine: RoutingEngineService,
    private readonly walletAdapter: SndWalletAdapter,
    private readonly notificationAdapter: SndNotificationAdapter,
    private readonly auditLogger: SndAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async createRequest(
    requesterId: string,
    createDto: CreateRequestDto,
    idempotencyKey: string,
  ): Promise<SndRequestEntity> {
    const existing = await this.requestRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.log('Idempotent request creation', {
        idempotencyKey,
        requestId: existing.id,
      });
      return existing;
    }

    if (createDto.category_id) {
      const category = await this.categoryRepository.findOne(createDto.category_id);
      if (!category) {
        throw new NotFoundException({
          type: 'https://errors.bthwani.com/snd/category_not_found',
          title: 'Category Not Found',
          status: 404,
          code: 'SND-404-CATEGORY-NOT-FOUND',
          detail: `Category ${createDto.category_id} not found`,
        });
      }

      if (!category.is_active) {
        throw new BadRequestException({
          type: 'https://errors.bthwani.com/snd/category_inactive',
          title: 'Category Inactive',
          status: 400,
          code: 'SND-400-CATEGORY-INACTIVE',
          detail: 'Category is not active',
        });
      }
    }

    const request = new SndRequestEntity();
    request.requester_id = requesterId;
    request.type = createDto.type;
    if (createDto.category_id !== undefined) {
      request.category_id = createDto.category_id;
    }
    request.title = createDto.title;
    request.description = createDto.description;
    if (createDto.images !== undefined) {
      request.images = createDto.images;
    }
    if (createDto.location !== undefined) {
      request.location = createDto.location;
    }
    if (createDto.address !== undefined) {
      request.address = createDto.address;
    }
    request.status = SndRequestStatus.PENDING;
    request.idempotency_key = idempotencyKey;

    if (request.type === SndRequestType.INSTANT) {
      const pricing = await this.pricingEngine.calculatePricing(
        request,
        request.location ? 'default' : undefined,
      );
      request.price_min_yer = pricing.min_price_yer;
      request.price_max_yer = pricing.max_price_yer;
      request.pricing_requires_review = pricing.requires_review;
      if (pricing.requires_review) {
        request.status = SndRequestStatus.PRICING_REVIEW;
        request.priced_at = new Date();
      } else {
        request.priced_at = new Date();
        const routingType = await this.routingEngine.routeRequest(request);
        request.routing_type = routingType;
        if (routingType !== 'manual_queue') {
          request.status = SndRequestStatus.ROUTED;
          request.routed_at = new Date();
        }
      }
    } else {
      const routingType = await this.routingEngine.routeRequest(request);
      request.routing_type = routingType;
      if (routingType !== 'manual_queue') {
        request.status = SndRequestStatus.ROUTED;
        request.routed_at = new Date();
      }
    }

    const saved = await this.requestRepository.create(request);

    await this.notificationAdapter.notifyRequestCreated(saved);

    await this.auditLogger.log({
      entityType: 'request',
      entityId: saved.id,
      action: 'create',
      userId: requesterId,
      newValues: {
        type: saved.type,
        status: saved.status,
        category_id: saved.category_id,
      },
    });

    return saved;
  }

  async updateStatus(
    requestId: string,
    userId: string,
    updateDto: UpdateRequestStatusDto,
  ): Promise<SndRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;
    const isProvider = request.assigned_provider_id === userId;

    if (!isRequester && !isCaptain && !isProvider) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'You are not authorized to update this request',
      });
    }

    const oldStatus = request.status;

    request.status = updateDto.status;

    switch (updateDto.status) {
      case SndRequestStatus.IN_PROGRESS:
        request.in_progress_at = new Date();
        break;
      case SndRequestStatus.COMPLETED:
        request.completed_at = new Date();
        if (request.in_progress_at) {
          const duration = request.completed_at.getTime() - request.in_progress_at.getTime();
          request.resolution_time_minutes = Math.floor(duration / (1000 * 60));
        }
        break;
      case SndRequestStatus.CANCELLED:
        request.cancelled_at = new Date();
        if (updateDto.reason !== undefined) {
          request.cancellation_reason = updateDto.reason;
        }
        break;
      case SndRequestStatus.ESCALATED:
        request.escalated_at = new Date();
        if (updateDto.reason !== undefined) {
          request.escalation_reason = updateDto.reason;
        }
        break;
    }

    const updated = await this.requestRepository.update(request);

    await this.notificationAdapter.notifyStatusChange(request, oldStatus, updateDto.status);

    await this.auditLogger.log({
      entityType: 'request',
      entityId: requestId,
      action: 'update_status',
      userId,
      oldValues: { status: oldStatus },
      newValues: { status: updateDto.status, reason: updateDto.reason },
    });

    return updated;
  }

  async acceptRequest(requestId: string, captainId: string): Promise<SndRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (request.type !== SndRequestType.INSTANT) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/invalid_request_type',
        title: 'Invalid Request Type',
        status: 400,
        code: 'SND-400-INVALID-REQUEST-TYPE',
        detail: 'Only instant requests can be accepted by captains',
      });
    }

    if (request.status !== SndRequestStatus.ROUTED && request.status !== SndRequestStatus.PENDING) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/invalid_status',
        title: 'Invalid Status',
        status: 400,
        code: 'SND-400-INVALID-STATUS',
        detail: `Request cannot be accepted in status ${request.status}`,
      });
    }

    await this.routingEngine.assignCaptain(request, captainId);

    request.status = SndRequestStatus.ACCEPTED;
    request.accepted_at = new Date();
    const updated = await this.requestRepository.update(request);

    await this.notificationAdapter.notifyRequestAccepted(request);

    await this.auditLogger.log({
      entityType: 'request',
      entityId: requestId,
      action: 'accept',
      userId: captainId,
      newValues: { status: request.status, assigned_captain_id: captainId },
    });

    return updated;
  }
}
