import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Headers,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ListingQueryService } from '../services/listing-query.service';
import { ModerationService } from '../services/moderation.service';
import { CatalogService } from '../services/catalog.service';
import { RankingConfigRepository } from '../repositories/ranking-config.repository';
import { AuditLoggerAdapter } from '../adapters/audit-logger.adapter';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { AdminListingsQueryDto } from '../dto/admin/admin-listings-query.dto';
import { AdminDecisionDto } from '../dto/admin/admin-decision.dto';
import { UpdateSkillsCatalogDto } from '../dto/admin/update-skills-catalog.dto';
import { UpdateRankingConfigDto } from '../dto/admin/update-ranking-config.dto';
import { ListingStatus } from '../entities/listing.entity';

/**
 * KWD Admin Controller
 * Handles admin endpoints (review, approval, catalog, ranking).
 */
@ApiTags('KWD Admin')
@Controller('api/kawader/admin')
@ApiBearerAuth()
export class KwdAdminController {
  constructor(
    private readonly listingQueryService: ListingQueryService,
    private readonly moderationService: ModerationService,
    private readonly catalogService: CatalogService,
    private readonly rankingConfigRepository: RankingConfigRepository,
    private readonly auditLoggerAdapter: AuditLoggerAdapter,
    private readonly analyticsAdapter: AnalyticsAdapter,
  ) {}

  /**
   * Admin review queue
   */
  @Get('listings')
  @ApiOperation({ summary: 'Admin review queue', operationId: 'kwd_admin_listings_review' })
  @ApiResponse({ status: 200, description: 'Admin listings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminListings(@Query() dto: AdminListingsQueryDto) {
    // TODO: Add AdminGuard
    const status = dto.status ? (dto.status as ListingStatus) : ListingStatus.PENDING_REVIEW;
    const listings = await this.listingQueryService.getListingsByStatus(status, dto.limit || 20);
    return {
      data: listings,
      pagination: {
        has_next: false,
        has_prev: false,
        next_cursor: null,
        prev_cursor: null,
      },
    };
  }

  /**
   * Admin approve/reject listing
   */
  @Post('listings/:id/decision')
  @ApiOperation({
    summary: 'Admin approve/reject listing',
    operationId: 'kwd_admin_listing_decision',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiHeader({
    name: 'X-Step-Up-Token',
    required: false,
    description: 'Step-Up token for sensitive operations',
  })
  @ApiResponse({ status: 200, description: 'Decision applied' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async applyDecision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminDecisionDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
    @Headers('idempotency-key') _idempotencyKey: string,
  ) {
    // TODO: Add AdminGuard, StepUpGuard, IdempotencyGuard
    let listing;
    if (dto.decision === 'approve') {
      listing = await this.moderationService.approveListing(id, userId, userRole, dto.reason);
    } else {
      listing = await this.moderationService.rejectListing(
        id,
        userId,
        userRole,
        dto.reason || 'Rejected',
      );
    }
    await this.auditLoggerAdapter.log({
      entity_type: 'listing',
      entity_id: id,
      action: `admin_${dto.decision}`,
      user_id: userId,
      user_role: userRole,
      metadata: { reason: dto.reason },
    });
    await this.analyticsAdapter.trackAdminApproval(id, userId, dto.decision);
    return listing;
  }

  /**
   * Get skills catalog
   */
  @Get('catalog/skills')
  @ApiOperation({ summary: 'Get skills catalog', operationId: 'kwd_admin_catalog' })
  @ApiResponse({ status: 200, description: 'Skills catalog' })
  async getSkillsCatalog() {
    // TODO: Add AdminGuard
    const skills = await this.catalogService.getAllSkills();
    return {
      skills,
      updated_at: new Date(),
    };
  }

  /**
   * Update skills catalog
   */
  @Patch('catalog/skills')
  @ApiOperation({ summary: 'Update skills catalog', operationId: 'kwd_admin_catalog_update' })
  @ApiHeader({ name: 'X-Step-Up-Token', required: false })
  @ApiResponse({ status: 200, description: 'Catalog updated' })
  async updateSkillsCatalog(
    @Body() dto: UpdateSkillsCatalogDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    // TODO: Add AdminGuard, StepUpGuard
    const skills = await this.catalogService.updateCatalog(dto, userId);
    await this.auditLoggerAdapter.log({
      entity_type: 'skill_catalog',
      entity_id: 'catalog',
      action: 'admin_catalog_update',
      user_id: userId,
      user_role: userRole,
      metadata: { operations_count: dto.operations.length },
    });
    return {
      skills,
      updated_at: new Date(),
    };
  }

  /**
   * Get ranking config
   */
  @Get('ranking/config')
  @ApiOperation({ summary: 'Get ranking weights', operationId: 'kwd_admin_ranking_config' })
  @ApiResponse({ status: 200, description: 'Ranking config' })
  async getRankingConfig() {
    // TODO: Add AdminGuard
    const config = await this.rankingConfigRepository.getCurrent();
    if (!config) {
      return {
        weights: {
          sponsored: 0.4,
          freshness: 0.3,
          proximity: 0.2,
          text_score: 0.1,
        },
        updated_at: new Date(),
        updated_by: 'system',
      };
    }
    return config;
  }

  /**
   * Update ranking config
   */
  @Patch('ranking/config')
  @ApiOperation({ summary: 'Update ranking weights', operationId: 'kwd_admin_ranking_update' })
  @ApiHeader({ name: 'X-Step-Up-Token', required: false })
  @ApiResponse({ status: 200, description: 'Ranking config updated' })
  async updateRankingConfig(
    @Body() dto: UpdateRankingConfigDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string,
  ) {
    // TODO: Add AdminGuard, StepUpGuard
    const config = await this.rankingConfigRepository.updateOrCreate(dto.weights, userId);
    await this.auditLoggerAdapter.log({
      entity_type: 'ranking_config',
      entity_id: 'config',
      action: 'admin_ranking_update',
      user_id: userId,
      user_role: userRole,
      after_state: { weights: dto.weights },
    });
    return config;
  }
}
