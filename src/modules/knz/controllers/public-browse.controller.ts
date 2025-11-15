import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BrowseService } from '../services/browse.service';
import { HomeFeedDto } from '../dto/public/home-feed.dto';
import { SearchListingsDto } from '../dto/public/search-listings.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Public } from '../../../core/decorators/public.decorator';

@ApiTags('KNZ Public Browse')
@Controller('knz')
export class PublicBrowseController {
  constructor(private readonly browseService: BrowseService) {}

  @Get('home-feed')
  @Public()
  @ApiOperation({ summary: 'Get home feed (categories and featured listings)' })
  @ApiResponse({ status: 200, description: 'Home feed retrieved successfully' })
  async getHomeFeed(@Query() query: HomeFeedDto, @CurrentUser() user?: JwtPayload) {
    return this.browseService.getHomeFeed(query, user?.sub);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search listings' })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  async searchListings(@Query() query: SearchListingsDto, @CurrentUser() user?: JwtPayload) {
    return this.browseService.searchListings(query, user?.sub);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Query('parent_id') parentId?: string) {
    return this.browseService.getCategories(parentId);
  }
}
