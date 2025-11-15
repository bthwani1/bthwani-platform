import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfDonorProfileRepository } from '../repositories/esf-donor-profile.repository';
import { EsfMatchRepository } from '../repositories/esf-match.repository';
import {
  EsfRequestEntity,
  EsfRequestStatus,
  BloodType,
  RhFactor,
} from '../entities/esf-request.entity';
import { EsfMatchEntity, EsfMatchStatus } from '../entities/esf-match.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import { EsfMetricsCollector } from './esf-metrics-collector.service';

@Injectable()
export class EsfMatchingService {
  private readonly maxRadiusKm: number;
  private readonly batchSize: number;
  private readonly cooldownDays: number;

  constructor(
    private readonly requestRepository: EsfRequestRepository,
    private readonly donorProfileRepository: EsfDonorProfileRepository,
    private readonly matchRepository: EsfMatchRepository,
    private readonly notificationAdapter: EsfNotificationAdapter,
    private readonly metricsCollector: EsfMetricsCollector,
    private readonly logger: LoggerService,
  ) {
    this.maxRadiusKm = parseInt(process.env.VAR_ESF_MAX_RADIUS_KM || '50', 10);
    this.batchSize = parseInt(process.env.VAR_ESF_MATCH_BATCH_SIZE || '10', 10);
    this.cooldownDays = parseInt(process.env.VAR_ESF_DONOR_COOLDOWN_DAYS || '90', 10);
  }

  async matchRequest(requestId: string): Promise<void> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request || request.status !== EsfRequestStatus.PENDING) {
      return;
    }

    const startTime = Date.now();

    let donors: Awaited<ReturnType<typeof this.donorProfileRepository.findAvailableDonors>>;

    if (request.location) {
      donors = await this.donorProfileRepository.findAvailableDonorsInRadius(
        request.abo_type,
        request.rh_factor,
        request.location.lat,
        request.location.lon,
        this.maxRadiusKm,
        {
          excludeUserIds: [request.requester_id],
          limit: this.batchSize,
        },
      );
    } else {
      donors = await this.donorProfileRepository.findAvailableDonors(
        request.abo_type,
        request.rh_factor,
        request.city,
        {
          excludeUserIds: [request.requester_id],
          limit: this.batchSize,
        },
      );
    }

    if (donors.length === 0) {
      this.logger.warn('No matching donors found', { requestId });
      return;
    }

    const matches: EsfMatchEntity[] = [];

    for (const donor of donors) {
      const existingMatch = await this.matchRepository.findByRequestAndDonor(
        requestId,
        donor.user_id,
      );
      if (existingMatch) {
        continue;
      }

      const match = new EsfMatchEntity();
      match.request_id = requestId;
      match.donor_id = donor.user_id;
      match.status = EsfMatchStatus.PENDING;

      if (request.location && donor.location) {
        match.distance_km = this.calculateDistance(
          request.location.lat,
          request.location.lon,
          donor.location.lat,
          donor.location.lon,
        );
      }

      const saved = await this.matchRepository.create(match);
      matches.push(saved);
    }

    if (matches.length > 0) {
      request.status = EsfRequestStatus.MATCHED;
      request.matched_at = new Date();
      const matchTimeMinutes = Math.floor((Date.now() - startTime) / 60000);
      request.match_time_minutes = matchTimeMinutes;
      await this.requestRepository.create(request);

      for (const match of matches) {
        match.notified_at = new Date();
        await this.matchRepository.create(match);
        await this.notificationAdapter.notifyDonorMatch(match.donor_id, requestId);
      }

      await this.metricsCollector.recordMatchTime(requestId, matchTimeMinutes);
    }
  }

  async getMatchesForRequest(requestId: string): Promise<EsfMatchEntity[]> {
    return this.matchRepository.findByRequest(requestId);
  }

  async getMatchesForDonor(
    donorId: string,
    options?: { cursor?: string; limit?: number; status?: EsfMatchStatus },
  ): Promise<{ items: EsfMatchEntity[]; nextCursor?: string }> {
    const matches = await this.matchRepository.findByDonor(donorId, options);

    const hasMore = options?.limit && matches.length > options.limit;
    const items = hasMore ? matches.slice(0, options.limit) : matches;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async acceptMatch(matchId: string, donorId: string): Promise<EsfMatchEntity> {
    const match = await this.matchRepository.findOne(matchId);
    if (!match || match.donor_id !== donorId) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/match_not_found',
        title: 'Match Not Found',
        status: 404,
        code: 'ESF-404-MATCH-NOT-FOUND',
        detail: `Match ${matchId} not found`,
      });
    }

    if (match.status !== EsfMatchStatus.PENDING) {
      throw new ConflictException({
        type: 'https://errors.bthwani.com/esf/invalid_match_status',
        title: 'Invalid Match Status',
        status: 409,
        code: 'ESF-409-INVALID-MATCH-STATUS',
        detail: `Match is already ${match.status}`,
      });
    }

    match.status = EsfMatchStatus.ACCEPTED;
    match.accepted_at = new Date();
    await this.matchRepository.create(match);

    const request = await this.requestRepository.findOne(match.request_id);
    if (request) {
      request.status = EsfRequestStatus.CONFIRMED;
      request.confirmed_at = new Date();
      await this.requestRepository.create(request);
      await this.notificationAdapter.notifyRequesterConfirmation(
        request.requester_id,
        match.request_id,
      );
    }

    return match;
  }

  async declineMatch(matchId: string, donorId: string): Promise<EsfMatchEntity> {
    const match = await this.matchRepository.findOne(matchId);
    if (!match || match.donor_id !== donorId) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/match_not_found',
        title: 'Match Not Found',
        status: 404,
        code: 'ESF-404-MATCH-NOT-FOUND',
        detail: `Match ${matchId} not found`,
      });
    }

    if (match.status !== EsfMatchStatus.PENDING) {
      throw new ConflictException({
        type: 'https://errors.bthwani.com/esf/invalid_match_status',
        title: 'Invalid Match Status',
        status: 409,
        code: 'ESF-409-INVALID-MATCH-STATUS',
        detail: `Match is already ${match.status}`,
      });
    }

    match.status = EsfMatchStatus.DECLINED;
    match.declined_at = new Date();
    await this.matchRepository.create(match);

    return match;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
