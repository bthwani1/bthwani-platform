import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BannerService } from '../services/banner.service';
import { BannerRepository } from '../repositories/banner.repository';
import { BannerEntity, BannerType, BannerActionType, BannerStatus } from '../entities/banner.entity';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RbacGuard, Roles } from '../../core/guards/rbac.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../core/strategies/jwt.strategy';

export class CreateBannerDto {
  type: BannerType;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image_url: string;
  action_type: BannerActionType;
  action_target: string;
  priority?: number;
  tags?: string[];
  available_regions?: string[];
  available_cities?: string[];
  start_date?: Date;
  end_date?: Date;
  metadata?: Record<string, unknown>;
}

export class UpdateBannerDto {
  title_ar?: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  action_type?: BannerActionType;
  action_target?: string;
  priority?: number;
  tags?: string[];
  available_regions?: string[];
  available_cities?: string[];
  start_date?: Date;
  end_date?: Date;
  status?: BannerStatus;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Banners Admin Controller
 *
 * Admin endpoints for managing banners
 */
@ApiTags('ADMIN')
@Controller('api/admin/banners')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles('admin', 'ops')
@ApiBearerAuth()
export class BannersAdminController {
  constructor(
    private readonly bannerService: BannerService,
    private readonly bannerRepository: BannerRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner created' })
  async createBanner(
    @Body() createDto: CreateBannerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BannerEntity> {
    const banner = new BannerEntity();
    banner.type = createDto.type;
    banner.title_ar = createDto.title_ar;
    banner.title_en = createDto.title_en;
    banner.description_ar = createDto.description_ar;
    banner.description_en = createDto.description_en;
    banner.image_url = createDto.image_url;
    banner.action_type = createDto.action_type;
    banner.action_target = createDto.action_target;
    banner.priority = createDto.priority || 0;
    banner.tags = createDto.tags;
    banner.available_regions = createDto.available_regions;
    banner.available_cities = createDto.available_cities;
    banner.start_date = createDto.start_date;
    banner.end_date = createDto.end_date;
    banner.metadata = createDto.metadata;
    banner.created_by = user.sub;

    return this.bannerRepository.create(banner);
  }

  @Get()
  @ApiOperation({ summary: 'List all banners' })
  @ApiResponse({ status: 200, description: 'Banners returned' })
  async listBanners(
    @Query('type') type?: BannerType,
    @Query('status') status?: BannerStatus,
    @Query('is_active') is_active?: boolean,
    @Query('region') region?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<BannerEntity[]> {
    return this.bannerRepository.findAll({
      type,
      status,
      is_active,
      region,
      city,
      limit,
      offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get banner by ID' })
  @ApiResponse({ status: 200, description: 'Banner returned' })
  async getBanner(@Param('id') id: string): Promise<BannerEntity | null> {
    return this.bannerRepository.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update banner' })
  @ApiResponse({ status: 200, description: 'Banner updated' })
  async updateBanner(
    @Param('id') id: string,
    @Body() updateDto: UpdateBannerDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BannerEntity> {
    const banner = await this.bannerRepository.findOne(id);
    if (!banner) {
      throw new Error('Banner not found');
    }

    if (updateDto.title_ar !== undefined) banner.title_ar = updateDto.title_ar;
    if (updateDto.title_en !== undefined) banner.title_en = updateDto.title_en;
    if (updateDto.description_ar !== undefined) banner.description_ar = updateDto.description_ar;
    if (updateDto.description_en !== undefined) banner.description_en = updateDto.description_en;
    if (updateDto.image_url !== undefined) banner.image_url = updateDto.image_url;
    if (updateDto.action_type !== undefined) banner.action_type = updateDto.action_type;
    if (updateDto.action_target !== undefined) banner.action_target = updateDto.action_target;
    if (updateDto.priority !== undefined) banner.priority = updateDto.priority;
    if (updateDto.tags !== undefined) banner.tags = updateDto.tags;
    if (updateDto.available_regions !== undefined)
      banner.available_regions = updateDto.available_regions;
    if (updateDto.available_cities !== undefined) banner.available_cities = updateDto.available_cities;
    if (updateDto.start_date !== undefined) banner.start_date = updateDto.start_date;
    if (updateDto.end_date !== undefined) banner.end_date = updateDto.end_date;
    if (updateDto.status !== undefined) banner.status = updateDto.status;
    if (updateDto.is_active !== undefined) banner.is_active = updateDto.is_active;
    if (updateDto.metadata !== undefined) banner.metadata = updateDto.metadata;
    banner.updated_by = user.sub;

    return this.bannerRepository.update(banner);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete banner' })
  @ApiResponse({ status: 204, description: 'Banner deleted' })
  async deleteBanner(@Param('id') id: string): Promise<void> {
    await this.bannerRepository.delete(id);
  }
}

