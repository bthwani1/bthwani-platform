import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CategoriesAdminService } from '../services/categories-admin.service';
import { CreateCategoryDto } from '../dto/categories/create-category.dto';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto';
import { ListCategoriesDto } from '../dto/categories/list-categories.dto';
import { GetCategoryDto } from '../dto/categories/get-category.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { RequiresStepUp } from '../../../core/guards/step-up.guard';
import { Request } from 'express';

@ApiTags('KNZ Categories Admin')
@Controller('knz/admin/categories')
@ApiBearerAuth()
export class CategoriesAdminController {
  constructor(private readonly categoriesAdminService: CategoriesAdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Category code already exists' })
  async createCategory(
    @Body() createDto: CreateCategoryDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.categoriesAdminService.createCategory(
      createDto,
      user.sub,
      user.email || '',
      request,
    );
  }

  @Put(':category_id')
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param() params: GetCategoryDto,
    @Body() updateDto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.categoriesAdminService.updateCategory(
      params.category_id,
      updateDto,
      user.sub,
      user.email || '',
      request,
    );
  }

  @Get(':category_id')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param() params: GetCategoryDto) {
    return this.categoriesAdminService.getCategory(params.category_id);
  }

  @Get()
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listCategories(@Query() query: ListCategoriesDto) {
    return this.categoriesAdminService.listCategories(query);
  }

  @Post(':category_id/enable')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Enable a category' })
  @ApiResponse({ status: 200, description: 'Category enabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async enableCategory(
    @Param() params: GetCategoryDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.categoriesAdminService.enableCategory(
      params.category_id,
      user.sub,
      user.email || '',
      request,
    );
  }

  @Post(':category_id/disable')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Disable a category' })
  @ApiResponse({ status: 200, description: 'Category disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async disableCategory(
    @Param() params: GetCategoryDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.categoriesAdminService.disableCategory(
      params.category_id,
      user.sub,
      user.email || '',
      request,
    );
  }
}
