import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ListingCommandService } from '../services/listing-command.service';
import { ListingQueryService } from '../services/listing-query.service';
import { ReportService } from '../services/report.service';
import { RankingEngineService } from '../services/ranking-engine.service';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { SearchListingsDto } from '../dto/public/search-listings.dto';
import { CreateListingDto } from '../dto/public/create-listing.dto';
import { UpdateListingDto } from '../dto/public/update-listing.dto';
import { ReportListingDto } from '../dto/public/report-listing.dto';

/**
 * KWD Public Controller
 * Handles public job listing endpoints (search, CRUD, report).
 */
@ApiTags('KWD Public')
@Controller('api/kawader')
export class KwdPublicController {
  constructor(
    private readonly listingCommandService: ListingCommandService,
    private readonly listingQueryService: ListingQueryService,
    private readonly reportService: ReportService,
    private readonly rankingEngineService: RankingEngineService,
    private readonly analyticsAdapter: AnalyticsAdapter,
  ) {}

  /**
   * Search job listings
   */
  @Get('search')
  @ApiOperation({ summary: 'Search KoWADER job listings', operationId: 'kwd_listings_search' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchListings(@Query() dto: SearchListingsDto) {
    const { data, has_next } = await this.listingQueryService.searchListings(dto);
    const rankedListings = await this.rankingEngineService.rankListings(data, dto.lat, dto.lon);
    await this.analyticsAdapter.trackSearchQuery(
      dto.keyword || '',
      dto as unknown as Record<string, unknown>,
      rankedListings.length,
    );
    const lastListing = rankedListings[rankedListings.length - 1];
    return {
      data: rankedListings,
      pagination: {
        has_next,
        has_prev: false,
        next_cursor: has_next && lastListing ? lastListing.created_at.toISOString() : null,
        prev_cursor: null,
      },
    };
  }

  /**
   * Get listing details
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get listing details', operationId: 'kwd_listing_get' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListing(@Param('id', ParseUUIDPipe) id: string) {
    const listing = await this.listingQueryService.getListing(id);
    await this.analyticsAdapter.trackListingView(id);
    return listing;
  }

  /**
   * Create listing
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create listing', operationId: 'kwd_listing_create' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createListing(
    @Body() dto: CreateListingDto,
    @Headers('x-user-id') userId: string,
    @Headers('idempotency-key') _idempotencyKey: string,
  ) {
    // TODO: Add JwtAuthGuard, IdempotencyGuard
    const listing = await this.listingCommandService.createListing(dto, userId);
    await this.analyticsAdapter.trackListingCreated(listing.id, userId, {
      entity_type: dto.entity_type,
    });
    return listing;
  }

  /**
   * Update listing
   */
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing', operationId: 'kwd_listing_update' })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async updateListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // TODO: Add JwtAuthGuard
    const isAdmin = userRole === 'admin';
    return this.listingCommandService.updateListing(id, dto, userId, isAdmin);
  }

  /**
   * Delete/close listing
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete/close listing', operationId: 'kwd_listing_delete' })
  @ApiResponse({ status: 204, description: 'Listing deleted/closed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async deleteListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // TODO: Add JwtAuthGuard
    const isAdmin = userRole === 'admin';
    await this.listingCommandService.deleteListing(id, userId, isAdmin);
  }

  /**
   * Report listing
   */
  @Post(':id/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report listing', operationId: 'kwd_listing_report' })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 409, description: 'Already reported' })
  async reportListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportListingDto,
    @Headers('x-user-id') userId: string,
    @Headers('idempotency-key') _idempotencyKey: string,
  ) {
    // TODO: Add JwtAuthGuard, IdempotencyGuard
    const report = await this.reportService.createReport(id, userId, dto);
    await this.analyticsAdapter.trackListingReported(id, userId, dto.reason);
    return report;
  }
}
