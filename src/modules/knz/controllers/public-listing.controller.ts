import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PublicListingService } from '../services/public-listing.service';
import { GetListingDto } from '../dto/public/get-listing.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Public } from '../../../core/decorators/public.decorator';

@ApiTags('KNZ Public Listings')
@Controller('knz/listings')
export class PublicListingController {
  constructor(private readonly listingService: PublicListingService) {}

  @Get(':listing_id')
  @Public()
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListing(@Param() params: GetListingDto, @CurrentUser() user?: JwtPayload) {
    return this.listingService.getListing(params.listing_id, user?.sub);
  }

  @Post(':listing_id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle favorite for a listing' })
  @ApiResponse({ status: 200, description: 'Favorite toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async toggleFavorite(@Param() params: GetListingDto, @CurrentUser() user: JwtPayload) {
    return this.listingService.toggleFavorite(params.listing_id, user.sub);
  }

  @Get('favorites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.listingService.getFavorites(user.sub, { cursor, limit });
  }
}
