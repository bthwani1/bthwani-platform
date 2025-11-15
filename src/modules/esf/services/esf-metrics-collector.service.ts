import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfMatchRepository } from '../repositories/esf-match.repository';
import { EsfRequestStatus } from '../entities/esf-request.entity';
import { EsfMatchStatus } from '../entities/esf-match.entity';

@Injectable()
export class EsfMetricsCollector {
  constructor(
    private readonly requestRepository: EsfRequestRepository,
    private readonly matchRepository: EsfMatchRepository,
    private readonly logger: LoggerService,
  ) {}

  async recordMatchTime(requestId: string, minutes: number): Promise<void> {
    this.logger.log('Match time recorded', {
      requestId,
      matchTimeMinutes: minutes,
      metric: 'esf_match_time_minutes',
    });
  }

  async getMetrics(): Promise<{
    matchTimeMinutes: number;
    noShowRate: number;
    closureTimeHours: number;
    activeDonorsCount: number;
    requestsPerCity: Record<string, number>;
  }> {
    const slaMinutes = parseInt(process.env.VAR_ESF_SLA_MATCH_MINUTES || '30', 10);
    const requests = await this.requestRepository.search({}, { limit: 1000 });

    let totalMatchTime = 0;
    let matchCount = 0;
    let noShowCount = 0;
    let totalClosureTime = 0;
    let closureCount = 0;
    const cityCounts: Record<string, number> = {};

    for (const request of requests) {
      if (request.city) {
        cityCounts[request.city] = (cityCounts[request.city] || 0) + 1;
      }

      if (request.match_time_minutes) {
        totalMatchTime += request.match_time_minutes;
        matchCount++;
      }

      if (
        request.status === EsfRequestStatus.COMPLETED &&
        request.completed_at &&
        request.created_at
      ) {
        const closureHours =
          (request.completed_at.getTime() - request.created_at.getTime()) / (1000 * 60 * 60);
        totalClosureTime += closureHours;
        closureCount++;
      }

      if (request.status === EsfRequestStatus.CANCELLED && request.cancelled_at) {
        const matches = await this.matchRepository.findByRequest(request.id);
        const hasAcceptedMatch = matches.some((m) => m.status === EsfMatchStatus.ACCEPTED);
        if (hasAcceptedMatch) {
          noShowCount++;
        }
      }
    }

    const avgMatchTime = matchCount > 0 ? totalMatchTime / matchCount : 0;
    const totalRequests = requests.length;
    const noShowRate = totalRequests > 0 ? (noShowCount / totalRequests) * 100 : 0;
    const avgClosureTime = closureCount > 0 ? totalClosureTime / closureCount : 0;

    return {
      matchTimeMinutes: Math.round(avgMatchTime * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      closureTimeHours: Math.round(avgClosureTime * 10) / 10,
      activeDonorsCount: 0,
      requestsPerCity: cityCounts,
    };
  }

  async checkAlerts(): Promise<{ yellow: string[]; red: string[] }> {
    const metrics = await this.getMetrics();
    const slaMinutes = parseInt(process.env.VAR_ESF_SLA_MATCH_MINUTES || '30', 10);
    const yellow: string[] = [];
    const red: string[] = [];

    if (metrics.matchTimeMinutes > slaMinutes) {
      yellow.push(`Match time ${metrics.matchTimeMinutes}min exceeds SLA ${slaMinutes}min`);
    }
    if (metrics.matchTimeMinutes > slaMinutes * 2) {
      red.push(`Match time ${metrics.matchTimeMinutes}min exceeds 2x SLA ${slaMinutes * 2}min`);
    }

    if (metrics.noShowRate > 15) {
      yellow.push(`No-show rate ${metrics.noShowRate}% exceeds 15%`);
    }
    if (metrics.noShowRate > 25) {
      red.push(`No-show rate ${metrics.noShowRate}% exceeds 25%`);
    }

    if (metrics.closureTimeHours > 2) {
      yellow.push(`Closure time ${metrics.closureTimeHours}h exceeds 2h`);
    }
    if (metrics.closureTimeHours > 4) {
      red.push(`Closure time ${metrics.closureTimeHours}h exceeds 4h`);
    }

    return { yellow, red };
  }
}
