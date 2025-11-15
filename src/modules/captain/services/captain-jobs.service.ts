import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import {
  ListOffersQueryDto,
  UpdateJobStatusDto,
  NegotiateFareDto,
} from '../dto/jobs/jobs.dto';
import { DshCaptainsService } from '../../dsh/services/dsh-captains.service';
import { CaptainCommandService } from '../../amn/services/captain-command.service';
import { IdempotencyService } from '../../wlt/services/idempotency.service';

@Injectable()
export class CaptainJobsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly dshCaptainsService: DshCaptainsService,
    private readonly amnCaptainCommandService: CaptainCommandService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async listDshOffers(
    captainId: string,
    query: ListOffersQueryDto,
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    this.logger.log('List DSH offers', { captainId, query });

    // TODO: Integrate with routing_dispatch service to get offers
    // For now, use DSH service
    const result = await this.dshCaptainsService.listOrders(captainId, {
      cursor: query.cursor,
      limit: query.limit || 20,
    });

    return {
      items: result.items,
      nextCursor: result.nextCursor,
    };
  }

  async acceptDshJob(
    captainId: string,
    jobId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Accept DSH job', { captainId, jobId, idempotencyKey });

    // TODO: Check idempotency
    // TODO: Check if offer is still valid
    const order = await this.dshCaptainsService.acceptOrder(captainId, jobId);
    return order;
  }

  async rejectDshJob(
    captainId: string,
    jobId: string,
    idempotencyKey: string,
  ): Promise<{ success: boolean }> {
    this.logger.log('Reject DSH job', { captainId, jobId, idempotencyKey });

    // TODO: Check idempotency
    // TODO: Record rejection reason
    return {
      success: true,
    };
  }

  async updateDshJobStatus(
    captainId: string,
    jobId: string,
    updateDto: UpdateJobStatusDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Update DSH job status', {
      captainId,
      jobId,
      status: updateDto.status,
      idempotencyKey,
    });

    // TODO: Check idempotency
    // TODO: Validate status transition
    // TODO: Update order status in DSH service
    const order = await this.dshCaptainsService.getOrder(captainId, jobId);

    // Map status updates
    if (updateDto.status === 'arrived_store') {
      // TODO: Mark as arrived at store
    } else if (updateDto.status === 'picked_up') {
      await this.dshCaptainsService.pickupOrder(captainId, jobId);
    } else if (updateDto.status === 'arrived_customer') {
      // TODO: Mark as arrived at customer
    } else if (updateDto.status === 'delivered') {
      await this.dshCaptainsService.deliverOrder(captainId, jobId, {});
    }

    return order;
  }

  async listAmnOffers(
    captainId: string,
    query: ListOffersQueryDto,
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    this.logger.log('List AMN offers', { captainId, query });

    // TODO: Integrate with AMN service to get offers
    // For now, return mock response
    return {
      items: [],
      nextCursor: undefined,
    };
  }

  async acceptAmnTrip(
    captainId: string,
    tripId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Accept AMN trip', { captainId, tripId, idempotencyKey });

    // TODO: Check idempotency
    // TODO: Check if offer is still valid
    // TODO: Integrate with AMN service
    return {
      trip_id: tripId,
      status: 'accepted',
    };
  }

  async updateAmnTripStatus(
    captainId: string,
    tripId: string,
    updateDto: UpdateJobStatusDto,
    idempotencyKey: string,
  ): Promise<unknown> {
    this.logger.log('Update AMN trip status', {
      captainId,
      tripId,
      status: updateDto.status,
      idempotencyKey,
    });

    // TODO: Check idempotency
    // TODO: Validate status transition
    // TODO: Integrate with AMN service
    return {
      trip_id: tripId,
      status: updateDto.status,
    };
  }

  async negotiateAmnFare(
    captainId: string,
    tripId: string,
    negotiateDto: NegotiateFareDto,
    idempotencyKey: string,
  ): Promise<{ fare: number; negotiated: boolean }> {
    this.logger.log('Negotiate AMN fare', {
      captainId,
      tripId,
      percentage: negotiateDto.percentage,
      idempotencyKey,
    });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_amn_trips_negotiate',
      requestBody: {
        captain_id: captainId,
        trip_id: tripId,
        percentage: negotiateDto.percentage,
      },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for fare negotiation', { idempotencyKey });
      return existing.response as { fare: number; negotiated: boolean };
    }

    // Validate percentage range (80-120%) - already validated in DTO
    // TODO: Validate negotiation is enabled (VAR_AMN_NEGOTIATION_ENABLED) - check runtime config
    // TODO: Check if negotiation is allowed (only before trip start) - check trip status
    // TODO: Integrate with AMN service
    const response = {
      fare: 0, // TODO: Calculate from base fare * percentage
      negotiated: true,
    };

    // Store idempotency
    await this.idempotencyService.storeIdempotency({
      idempotencyKey,
      operation: 'captain_amn_trips_negotiate',
      requestBody: {
        captain_id: captainId,
        trip_id: tripId,
        percentage: negotiateDto.percentage,
      },
      response,
      statusCode: 200,
    });

    return response;
  }

  async updateLocation(
    captainId: string,
    locationDto: { lat: number; lng: number },
    idempotencyKey: string,
  ): Promise<{ success: boolean }> {
    this.logger.log('Update location', {
      captainId,
      lat: locationDto.lat,
      lng: locationDto.lng,
      idempotencyKey,
    });

    // TODO: Check idempotency
    // TODO: Integrate with routing_dispatch service
    return {
      success: true,
    };
  }
}

