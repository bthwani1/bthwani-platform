import { Controller, Get, Post, Param, Query, Body, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { ListingQueryService } from '../services/listing-query.service';
import { ModerationService } from '../services/moderation.service';
import { AuditLoggerAdapter } from '../adapters/audit-logger.adapter';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { ReportsInboxQueryDto } from '../dto/support/reports-inbox-query.dto';
import { SupportActionDto } from '../dto/support/support-action.dto';
import { ReportStatus, ReportReason } from '../entities/report.entity';

/**
 * KWD Support Controller
 * Handles support endpoints (reports, moderation, actions).
 */
@ApiTags('KWD Support')
@Controller('api/kawader/support')
@ApiBearerAuth()
export class KwdSupportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly listingQueryService: ListingQueryService,
    private readonly moderationService: ModerationService,
    private readonly auditLoggerAdapter: AuditLoggerAdapter,
    private readonly analyticsAdapter: AnalyticsAdapter,
  ) {}

  /**
   * Support reports inbox
   */
  @Get('reports')
  @ApiOperation({ summary: 'Support reports inbox', operationId: 'kwd_support_reports_inbox' })
  @ApiResponse({ status: 200, description: 'Reports inbox' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getReportsInbox(@Query() dto: ReportsInboxQueryDto) {
    // TODO: Add SupportGuard
    const filters: {
      status?: ReportStatus;
      reason?: ReportReason;
      cursor?: string;
      limit?: number;
    } = {};
    if (dto.status) filters.status = dto.status as ReportStatus;
    if (dto.reason) filters.reason = dto.reason as ReportReason;
    if (dto.cursor) filters.cursor = dto.cursor;
    if (dto.limit) filters.limit = dto.limit;

    const { data, has_next } = await this.reportService.getReports(filters);
    const lastReport = data[data.length - 1];
    return {
      data,
      pagination: {
        has_next,
        has_prev: false,
        next_cursor: has_next && lastReport ? lastReport.created_at.toISOString() : null,
        prev_cursor: null,
      },
    };
  }

  /**
   * Support listing detail with full history
   */
  @Get('listings/:id')
  @ApiOperation({
    summary: 'Support listing detail with full history',
    operationId: 'kwd_support_listing_detail',
  })
  @ApiResponse({ status: 200, description: 'Listing with history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListingDetail(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Add SupportGuard
    const listing = await this.listingQueryService.getListing(id);
    const reports = await this.reportService.getReportsByListing(id);
    const actions = await this.moderationService.getModerationHistory(id);
    return {
      listing,
      reports,
      actions,
    };
  }

  /**
   * Apply moderation action
   */
  @Post('actions')
  @ApiOperation({ summary: 'Apply moderation action', operationId: 'kwd_support_action_apply' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiHeader({
    name: 'X-Step-Up-Token',
    required: false,
    description: 'Step-Up token for strong actions',
  })
  @ApiResponse({ status: 200, description: 'Action applied' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async applyAction(
    @Body() dto: SupportActionDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('idempotency-key') _idempotencyKey: string,
  ) {
    // TODO: Add SupportGuard, StepUpGuard (for strong actions), IdempotencyGuard
    let listing;
    switch (dto.action) {
      case 'hide':
        listing = await this.moderationService.hideListing(
          dto.listing_id,
          userId,
          userRole,
          dto.reason,
        );
        break;
      case 'soft_delete':
        await this.moderationService.softDeleteListing(
          dto.listing_id,
          userId,
          userRole,
          dto.reason,
        );
        listing = await this.listingQueryService.getListing(dto.listing_id);
        break;
      case 'warn':
      case 'temp_block':
        // TODO: Implement warn/temp_block logic
        throw new Error('Action not yet implemented');
      default:
        throw new Error(`Unknown action: ${dto.action}`);
    }
    await this.auditLoggerAdapter.log({
      entity_type: 'listing',
      entity_id: dto.listing_id,
      action: `support_${dto.action}`,
      user_id: userId,
      user_role: userRole,
      metadata: { reason: dto.reason, duration_days: dto.duration_days },
    });
    await this.analyticsAdapter.trackSupportAction(dto.listing_id, userId, dto.action);
    return {
      action_id: `action_${Date.now()}`,
      listing,
      applied_at: new Date(),
    };
  }
}
