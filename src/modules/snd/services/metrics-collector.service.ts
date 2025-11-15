import { Injectable } from '@nestjs/common';
import { SndRequestRepository } from '../repositories/request.repository';
import { SndAuditLogRepository } from '../repositories/snd-audit-log.repository';
import { SndRequestStatus, SndRequestType } from '../entities/request.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface SndKPIs {
  requests_total: number;
  requests_instant_count: number;
  requests_specialized_count: number;
  requests_instant_vs_specialized_ratio: number;
  sla_compliance_rate: number;
  cancellation_rate: number;
  dispute_rate: number;
  reroute_count: number;
  avg_resolution_time_minutes: number;
  requests_by_status: Record<string, number>;
  requests_by_type: Record<string, number>;
}

@Injectable()
export class SndMetricsCollectorService {
  constructor(
    private readonly requestRepository: SndRequestRepository,
    private readonly auditLogRepository: SndAuditLogRepository,
    private readonly logger: LoggerService,
  ) {}

  async getKPIs(options?: { startDate?: Date; endDate?: Date }): Promise<SndKPIs> {
    const allRequests = await this.requestRepository.findByStatus(SndRequestStatus.PENDING, {});

    const instantCount = await this.requestRepository.countByType(SndRequestType.INSTANT);
    const specializedCount = await this.requestRepository.countByType(SndRequestType.SPECIALIZED);
    const totalCount = instantCount + specializedCount;

    const completedRequests = allRequests.filter(
      (r) => r.status === SndRequestStatus.COMPLETED || r.status === SndRequestStatus.CLOSED,
    );

    const cancelledRequests = allRequests.filter((r) => r.status === SndRequestStatus.CANCELLED);

    const disputedRequests = allRequests.filter(
      (r) => r.status === SndRequestStatus.DISPUTED || r.status === SndRequestStatus.ESCALATED,
    );

    const reroutes = await this.auditLogRepository.findByAction('reroute', {});

    const avgResolutionTime =
      completedRequests.length > 0
        ? completedRequests.reduce((sum, r) => sum + (r.resolution_time_minutes || 0), 0) /
          completedRequests.length
        : 0;

    const requestsByStatus: Record<string, number> = {};
    for (const status of Object.values(SndRequestStatus)) {
      requestsByStatus[status] = await this.requestRepository.countByStatus(status);
    }

    const requestsByType: Record<string, number> = {
      instant: instantCount,
      specialized: specializedCount,
    };

    const slaComplianceRate = totalCount > 0 ? (completedRequests.length / totalCount) * 100 : 0;
    const cancellationRate = totalCount > 0 ? (cancelledRequests.length / totalCount) * 100 : 0;
    const disputeRate = totalCount > 0 ? (disputedRequests.length / totalCount) * 100 : 0;
    const instantVsSpecializedRatio =
      specializedCount > 0 ? instantCount / specializedCount : instantCount;

    return {
      requests_total: totalCount,
      requests_instant_count: instantCount,
      requests_specialized_count: specializedCount,
      requests_instant_vs_specialized_ratio: instantVsSpecializedRatio,
      sla_compliance_rate: slaComplianceRate,
      cancellation_rate: cancellationRate,
      dispute_rate: disputeRate,
      reroute_count: reroutes.length,
      avg_resolution_time_minutes: avgResolutionTime,
      requests_by_status: requestsByStatus,
      requests_by_type: requestsByType,
    };
  }
}
