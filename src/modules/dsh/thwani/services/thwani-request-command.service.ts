import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniRequestRepository } from '../repositories/thwani-request.repository';
import { ThwaniRequestEntity, ThwaniRequestStatus } from '../entities/thwani-request.entity';
import { ThwaniPricingEngineService } from './thwani-pricing-engine.service';
import { ThwaniRoutingEngineService } from './thwani-routing-engine.service';
import { ThwaniWalletAdapter } from '../adapters/thwani-wallet.adapter';
import { ThwaniNotificationAdapter } from '../adapters/thwani-notification.adapter';

export interface CreateThwaniRequestDto {
  category_id?: string;
  title: string;
  description: string;
  images?: string[];
  location?: { lat: number; lon: number };
  address?: string;
  region?: string;
}

export interface UpdateThwaniRequestStatusDto {
  status: ThwaniRequestStatus;
  reason?: string;
  price_final_yer?: number;
}

/**
 * Thwani Request Command Service
 *
 * Handles creation and status updates for instant help requests.
 */
@Injectable()
export class ThwaniRequestCommandService {
  constructor(
    private readonly requestRepository: ThwaniRequestRepository,
    private readonly pricingEngine: ThwaniPricingEngineService,
    private readonly routingEngine: ThwaniRoutingEngineService,
    private readonly walletAdapter: ThwaniWalletAdapter,
    private readonly notificationAdapter: ThwaniNotificationAdapter,
    private readonly logger: LoggerService,
  ) {}

  async createRequest(
    requesterId: string,
    createDto: CreateThwaniRequestDto,
    idempotencyKey: string,
  ): Promise<ThwaniRequestEntity> {
    const existing = await this.requestRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.log('Idempotent request creation', {
        idempotencyKey,
        requestId: existing.id,
      });
      return existing;
    }

    const request = new ThwaniRequestEntity();
    request.requester_id = requesterId;
    if (createDto.category_id !== undefined) {
      request.category_id = createDto.category_id;
    }
    // Thwani is always dsh_quick_task category
    request.dsh_category_code = 'dsh_quick_task';
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
    if (createDto.region !== undefined) {
      request.region = createDto.region;
    }
    request.status = ThwaniRequestStatus.PENDING;
    request.idempotency_key = idempotencyKey;

    // Calculate pricing (scope-based: category+region → category → region → global)
    const pricing = await this.pricingEngine.calculatePricing(request, createDto.region);
    request.price_min_yer = pricing.min_price_yer;
    request.price_max_yer = pricing.max_price_yer;
    request.pricing_requires_review = pricing.requires_review;

    if (pricing.requires_review) {
      request.status = ThwaniRequestStatus.PRICING_REVIEW;
      request.priced_at = new Date();
    } else {
      request.priced_at = new Date();
      const routingType = await this.routingEngine.routeRequest(request);
      request.routing_type = routingType;
      if (routingType !== 'manual_queue') {
        request.status = ThwaniRequestStatus.ROUTED;
        request.routed_at = new Date();
      }
    }

    const saved = await this.requestRepository.create(request);

    await this.notificationAdapter.notifyRequestCreated(saved);

    return saved;
  }

  async updateStatus(
    requestId: string,
    userId: string,
    updateDto: UpdateThwaniRequestStatusDto,
  ): Promise<ThwaniRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'You are not authorized to update this request',
      });
    }

    const oldStatus = request.status;
    request.status = updateDto.status;

    if (updateDto.price_final_yer !== undefined) {
      request.price_final_yer = updateDto.price_final_yer;
    }

    switch (updateDto.status) {
      case ThwaniRequestStatus.ACCEPTED:
        if (!isCaptain) {
          throw new ForbiddenException({
            type: 'https://errors.bthwani.com/thwani/unauthorized',
            title: 'Unauthorized',
            status: 403,
            code: 'THWANI-403-UNAUTHORIZED',
            detail: 'Only captain can accept requests',
          });
        }
        request.accepted_at = new Date();
        break;
      case ThwaniRequestStatus.IN_PROGRESS:
        request.in_progress_at = new Date();
        break;
      case ThwaniRequestStatus.COMPLETED:
        request.completed_at = new Date();
        break;
      case ThwaniRequestStatus.CANCELLED:
        request.cancelled_at = new Date();
        if (updateDto.reason) {
          request.cancellation_reason = updateDto.reason;
        }
        break;
      case ThwaniRequestStatus.ESCALATED:
        request.escalated_at = new Date();
        if (updateDto.reason) {
          request.escalation_reason = updateDto.reason;
        }
        break;
    }

    const updated = await this.requestRepository.update(request);

    await this.notificationAdapter.notifyRequestStatusChanged(updated, oldStatus);

    return updated;
  }

  async acceptRequest(requestId: string, captainId: string): Promise<ThwaniRequestEntity> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (
      request.status !== ThwaniRequestStatus.ROUTED &&
      request.status !== ThwaniRequestStatus.PENDING
    ) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/invalid_status',
        title: 'Invalid Status',
        status: 400,
        code: 'THWANI-400-INVALID-STATUS',
        detail: `Cannot accept request in status ${request.status}`,
      });
    }

    await this.routingEngine.assignCaptain(request, captainId);

    request.status = ThwaniRequestStatus.ACCEPTED;
    request.accepted_at = new Date();

    const updated = await this.requestRepository.update(request);

    await this.notificationAdapter.notifyRequestAccepted(updated);

    return updated;
  }
}

