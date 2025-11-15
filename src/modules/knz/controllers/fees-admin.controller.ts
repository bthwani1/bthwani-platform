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
import { FeesAdminService } from '../services/fees-admin.service';
import { CreateFeeProfileDto } from '../dto/fees/create-fee-profile.dto';
import { UpdateFeeProfileDto } from '../dto/fees/update-fee-profile.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { RequiresStepUp } from '../../../core/guards/step-up.guard';
import { IdParamDto } from '../dto/common/id-param.dto';
import { FeeProfileScope } from '../entities/fee-profile.entity';
import { Request } from 'express';

@ApiTags('KNZ Fees Admin')
@Controller('knz/admin/fees')
@ApiBearerAuth()
export class FeesAdminController {
  constructor(private readonly feesAdminService: FeesAdminService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Create a new fee profile' })
  @ApiResponse({ status: 201, description: 'Fee profile created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Fee profile code already exists' })
  async createFeeProfile(
    @Body() createDto: CreateFeeProfileDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.feesAdminService.createFeeProfile(createDto, user.sub, user.email || '', request);
  }

  @Put(':id')
  @Roles('admin')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Update a fee profile' })
  @ApiResponse({ status: 200, description: 'Fee profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Fee profile not found' })
  async updateFeeProfile(
    @Param() params: IdParamDto,
    @Body() updateDto: UpdateFeeProfileDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.feesAdminService.updateFeeProfile(
      params.id,
      updateDto,
      user.sub,
      user.email || '',
      request,
    );
  }

  @Get(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get fee profile by ID' })
  @ApiResponse({ status: 200, description: 'Fee profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Fee profile not found' })
  async getFeeProfile(@Param() params: IdParamDto) {
    return this.feesAdminService.getFeeProfile(params.id);
  }

  @Get()
  @Roles('admin', 'finance', 'ops')
  @ApiOperation({ summary: 'List fee profiles' })
  @ApiResponse({ status: 200, description: 'Fee profiles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listFeeProfiles(
    @Query('status') status?: string,
    @Query('scope') scope?: FeeProfileScope,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.feesAdminService.listFeeProfiles({
      status: status as any,
      scope,
      limit,
      offset,
    });
  }

  @Get('scope/:scope')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Find fee profiles by scope' })
  @ApiResponse({ status: 200, description: 'Fee profiles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByScope(
    @Param('scope') scope: FeeProfileScope,
    @Query('region_code') regionCode?: string,
    @Query('category_id') categoryId?: string,
    @Query('subcategory_id') subcategoryId?: string,
    @Query('status') status?: string,
  ) {
    return this.feesAdminService.findByScope({
      scope,
      region_code: regionCode,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      status: status as any,
    });
  }
}
