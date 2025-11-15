import { Injectable, ForbiddenException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { UpdateAvailabilityDto } from '../dto/availability/availability.dto';
import { DshCaptainsService } from '../../dsh/services/dsh-captains.service';
import { CaptainCommandService } from '../../amn/services/captain-command.service';
import { CaptainIdentityAdapter } from '../adapters/captain-identity.adapter';
import { IdempotencyService } from '../../wlt/services/idempotency.service';

@Injectable()
export class CaptainAvailabilityService {
  constructor(
    private readonly logger: LoggerService,
    private readonly dshCaptainsService: DshCaptainsService,
    private readonly amnCaptainCommandService: CaptainCommandService,
    private readonly identityAdapter: CaptainIdentityAdapter,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async updateDshAvailability(
    captainId: string,
    updateDto: UpdateAvailabilityDto,
    idempotencyKey: string,
  ): Promise<{ online: boolean; service: string }> {
    this.logger.log('Update DSH availability', {
      captainId,
      online: updateDto.online,
      idempotencyKey,
    });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_dls_availability_update',
      requestBody: { captain_id: captainId, online: updateDto.online },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for DSH availability', { idempotencyKey });
      return existing.response as { online: boolean; service: string };
    }

    // TODO: Integrate with routing_dispatch service
    // TODO: Update captain availability in DSH service
    const response = {
      online: updateDto.online,
      service: 'DSH',
    };

    // Store idempotency
    await this.idempotencyService.storeIdempotency({
      idempotencyKey,
      operation: 'captain_dls_availability_update',
      requestBody: { captain_id: captainId, online: updateDto.online },
      response,
      statusCode: 200,
    });

    return response;
  }

  async updateAmnAvailability(
    captainId: string,
    updateDto: UpdateAvailabilityDto,
    idempotencyKey: string,
  ): Promise<{ online: boolean; service: string }> {
    this.logger.log('Update AMN availability', {
      captainId,
      online: updateDto.online,
      idempotencyKey,
    });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_amn_availability_update',
      requestBody: { captain_id: captainId, online: updateDto.online },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for AMN availability', { idempotencyKey });
      return existing.response as { online: boolean; service: string };
    }

    // Check AMN eligibility (female only)
    const eligibility = await this.identityAdapter.getCaptainEligibility(captainId);
    if (!eligibility.amn.eligible) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/captain/not_eligible_amn',
        title: 'Not Eligible for AMN Service',
        status: 403,
        code: 'CAP-NOT-ELIGIBLE-AMN',
        detail: 'غير مؤهل لخدمة أمانة',
      });
    }

    // TODO: Integrate with routing_dispatch service
    // TODO: Update captain availability in AMN service
    const response = {
      online: updateDto.online,
      service: 'AMN',
    };

    // Store idempotency
    await this.idempotencyService.storeIdempotency({
      idempotencyKey,
      operation: 'captain_amn_availability_update',
      requestBody: { captain_id: captainId, online: updateDto.online },
      response,
      statusCode: 200,
    });

    return response;
  }

  async getAvailabilityStatus(captainId: string): Promise<{
    online: boolean;
    activeServices: string[];
    dsh: { online: boolean };
    amn: { online: boolean; eligible: boolean };
  }> {
    this.logger.log('Get availability status', { captainId });

    // Check eligibility
    const eligibility = await this.identityAdapter.getCaptainEligibility(captainId);

    // TODO: Fetch from routing_dispatch service
    // For now, return mock response with eligibility
    return {
      online: true,
      activeServices: eligibility.dsh.eligible ? ['DSH'] : [],
      dsh: {
        online: eligibility.dsh.eligible,
      },
      amn: {
        online: false,
        eligible: eligibility.amn.eligible,
      },
    };
  }
}

