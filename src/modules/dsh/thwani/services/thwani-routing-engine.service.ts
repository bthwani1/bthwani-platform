import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniRequestRepository } from '../repositories/thwani-request.repository';
import {
  ThwaniRequestEntity,
  ThwaniRoutingType,
  ThwaniRequestStatus,
} from '../entities/thwani-request.entity';

/**
 * Thwani Routing Engine Service
 *
 * Routes instant help requests to captains or manual queue.
 * Reuses DSH captain routing patterns.
 */
@Injectable()
export class ThwaniRoutingEngineService {
  constructor(
    private readonly requestRepository: ThwaniRequestRepository,
    private readonly logger: LoggerService,
  ) {}

  async routeRequest(request: ThwaniRequestEntity): Promise<ThwaniRoutingType> {
    // For now, default to captain routing
    // TODO: Add config-based routing policy (similar to DSH)
    // This can be extended to support manual queue based on config
    return ThwaniRoutingType.CAPTAIN;
  }

  async assignCaptain(request: ThwaniRequestEntity, captainId: string): Promise<void> {
    if (request.status !== ThwaniRequestStatus.ROUTED && request.status !== ThwaniRequestStatus.PENDING) {
      throw new Error(`Cannot assign captain to request in status ${request.status}`);
    }

    request.assigned_captain_id = captainId;
    request.routing_type = ThwaniRoutingType.CAPTAIN;
    if (request.status === ThwaniRequestStatus.PENDING) {
      request.status = ThwaniRequestStatus.ROUTED;
      request.routed_at = new Date();
    }
    await this.requestRepository.update(request);
  }
}

