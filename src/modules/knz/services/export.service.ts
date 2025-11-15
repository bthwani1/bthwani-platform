import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReportingQueryService } from './reporting-query.service';
import { ExportDataDto, ExportFormat, ExportEntityType } from '../dto/export/export-data.dto';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class ExportService {
  constructor(
    private readonly reportingQueryService: ReportingQueryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async exportData(
    exportDto: ExportDataDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<{
    export_id: string;
    format: ExportFormat;
    download_url?: string;
    expires_at: Date;
  }> {
    if (exportDto.mask_sensitive === false) {
      throw new ForbiddenException({
        type: 'https://api.bthwani.com/problems/privacy-export-violation',
        title: 'Privacy Export Violation',
        status: 403,
        code: 'G-PRIVACY-EXPORT',
        detail: 'Unmasked exports are not allowed for sensitive data',
      });
    }

    const exportId = this.generateExportId();
    const format = exportDto.format || ExportFormat.CSV;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let data: unknown;
    switch (exportDto.entity_type) {
      case ExportEntityType.LISTINGS:
        data = await this.exportListings(exportDto);
        break;
      case ExportEntityType.ORDERS:
        data = await this.exportOrders(exportDto);
        break;
      case ExportEntityType.ABUSE_REPORTS:
        data = await this.exportAbuseReports(exportDto);
        break;
      case ExportEntityType.METRICS:
        data = await this.exportMetrics(exportDto);
        break;
      default:
        throw new BadRequestException(`Unsupported entity type: ${exportDto.entity_type}`);
    }

    await this.auditLogService.log({
      entityType: AuditEntityType.EXPORT,
      entityId: exportId,
      action: AuditAction.EXPORT,
      userId,
      userEmail,
      newValues: {
        entity_type: exportDto.entity_type,
        format,
        mask_sensitive: exportDto.mask_sensitive ?? true,
      },
      request,
      reason: `Export requested for ${exportDto.entity_type}`,
    });

    return {
      export_id: exportId,
      format,
      expires_at: expiresAt,
    };
  }

  private async exportListings(exportDto: ExportDataDto): Promise<unknown> {
    const result = await this.reportingQueryService.listListings(
      {
        cursor: undefined,
        limit: 10000,
      },
      undefined,
    );
    return result.items;
  }

  private async exportOrders(exportDto: ExportDataDto): Promise<unknown> {
    const result = await this.reportingQueryService.listOrders(
      {
        cursor: undefined,
        limit: 10000,
      },
      undefined,
    );
    return result.items;
  }

  private async exportAbuseReports(exportDto: ExportDataDto): Promise<unknown> {
    const result = await this.reportingQueryService.listAbuseReports({
      cursor: undefined,
      limit: 10000,
    });
    return result.items;
  }

  private async exportMetrics(exportDto: ExportDataDto): Promise<unknown> {
    return this.reportingQueryService.getMetrics({
      start_date: exportDto.start_date,
      end_date: exportDto.end_date,
    });
  }

  private generateExportId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
