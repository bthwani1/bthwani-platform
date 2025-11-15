import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BannerService } from '../services/banner.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../core/strategies/jwt.strategy';

/**
 * Banners Controller
 *
 * Provides banner endpoints for DSH, KNZ, and ARB
 */
@ApiTags('APP-USER')
@Controller('api/banners')
@UseGuards(JwtAuthGuard)
export class BannersController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get banners for a service' })
  @ApiResponse({ status: 200, description: 'Banners returned' })
  async getBanners(
    @Query('type') type: 'dsh' | 'knz' | 'arb',
    @Query('region') region?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.bannerService.getBanners(type, {
      region,
      city,
      userId: user?.sub,
      limit,
    });
  }

  @Get('refresh-interval')
  @ApiOperation({ summary: 'Get banner refresh interval' })
  @ApiResponse({ status: 200, description: 'Refresh interval returned' })
  async getRefreshInterval() {
    return {
      interval_seconds: await this.bannerService.getRefreshInterval(),
    };
  }
}

