import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DshCategoryService } from '../services/dsh-category.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';

/**
 * DSH Categories Controller
 *
 * Endpoints for managing DSH subcategories (restaurants, supermarkets, fashion, etc.)
 * Includes Thwani (dsh_quick_task) as a category.
 */
@ApiTags('APP-USER')
@Controller('api/dls/categories')
@UseGuards(JwtAuthGuard)
export class DshCategoriesController {
  constructor(private readonly categoryService: DshCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List DSH categories' })
  @ApiResponse({ status: 200, description: 'Categories listed' })
  async listCategories(
    @Query('region') region?: string,
    @Query('city') city?: string,
    @Query('include_thwani') includeThwani?: boolean,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.categoryService.getCategoriesForUser({
      userId: user?.sub,
      region,
      city,
      includeThwani: includeThwani === true,
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'List featured DSH categories' })
  @ApiResponse({ status: 200, description: 'Featured categories listed' })
  async listFeatured(
    @Query('region') region?: string,
    @Query('city') city?: string,
  ) {
    return this.categoryService.findFeatured({ region, city });
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get category by code' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategory(@Param('code') code: string) {
    return this.categoryService.findByCode(code);
  }
}

