import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { SndRequestRepository } from '../repositories/request.repository';
import { SndConfigRepository } from '../repositories/snd-config.repository';
import {
  SndRequestEntity,
  SndRequestType,
  SndRoutingType,
  SndRequestStatus,
} from '../entities/request.entity';
import { SndConfigScope } from '../entities/snd-config.entity';

@Injectable()
export class RoutingEngineService {
  constructor(
    private readonly requestRepository: SndRequestRepository,
    private readonly configRepository: SndConfigRepository,
    private readonly logger: LoggerService,
  ) {}

  async routeRequest(request: SndRequestEntity): Promise<SndRoutingType> {
    if (request.type === SndRequestType.SPECIALIZED) {
      return SndRoutingType.SPECIALIZED_PROVIDER;
    }

    const routingConfigOptions: {
      scope: SndConfigScope;
      categoryId?: string;
    } = {
      scope: SndConfigScope.CATEGORY,
    };
    if (request.category_id !== undefined) {
      routingConfigOptions.categoryId = request.category_id;
    }
    const routingConfig = await this.configRepository.findByKey('routing.policy', routingConfigOptions);

    if (!routingConfig) {
      const globalConfig = await this.configRepository.findByKey('routing.policy', {
        scope: SndConfigScope.GLOBAL,
      });
      if (globalConfig && globalConfig.value) {
        const policy = globalConfig.value.policy as string;
        if (policy === 'manual') {
          return SndRoutingType.MANUAL_QUEUE;
        }
      }
    } else if (routingConfig.value) {
      const policy = routingConfig.value.policy as string;
      if (policy === 'manual') {
        return SndRoutingType.MANUAL_QUEUE;
      }
    }

    return SndRoutingType.CAPTAIN;
  }

  async assignCaptain(request: SndRequestEntity, captainId: string): Promise<void> {
    if (request.type !== SndRequestType.INSTANT) {
      throw new Error('Cannot assign captain to specialized request');
    }

    if (request.status !== SndRequestStatus.ROUTED && request.status !== SndRequestStatus.PENDING) {
      throw new Error(`Cannot assign captain to request in status ${request.status}`);
    }

    request.assigned_captain_id = captainId;
    request.routing_type = SndRoutingType.CAPTAIN;
    if (request.status === SndRequestStatus.PENDING) {
      request.status = SndRequestStatus.ROUTED;
      request.routed_at = new Date();
    }
    await this.requestRepository.update(request);
  }

  async assignProvider(request: SndRequestEntity, providerId: string): Promise<void> {
    if (request.type !== SndRequestType.SPECIALIZED) {
      throw new Error('Cannot assign provider to instant request');
    }

    if (request.status !== SndRequestStatus.ROUTED && request.status !== SndRequestStatus.PENDING) {
      throw new Error(`Cannot assign provider to request in status ${request.status}`);
    }

    request.assigned_provider_id = providerId;
    request.routing_type = SndRoutingType.SPECIALIZED_PROVIDER;
    if (request.status === SndRequestStatus.PENDING) {
      request.status = SndRequestStatus.ROUTED;
      request.routed_at = new Date();
    }
    await this.requestRepository.update(request);
  }
}
