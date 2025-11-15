import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SndMetricsCollectorService } from '../services/metrics-collector.service';
import { UpdateConfigDto } from '../dto/admin/update-config.dto';
import { UpdatePricingProfileDto } from '../dto/admin/update-pricing-profile.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RbacGuard } from '../../../core/guards/rbac.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';

@ApiTags('SND Admin')
@Controller('api/snd/admin')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SndAdminController {
  constructor(private readonly metricsCollectorService: SndMetricsCollectorService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get SND configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig() {
    return { message: 'Config endpoint - to be implemented' };
  }

  @Patch('config')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update SND configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(@Body() updateDto: UpdateConfigDto, @CurrentUser() user: JwtPayload) {
    return { message: 'Config update endpoint - to be implemented', dto: updateDto };
  }

  @Patch('pricing')
  @UseGuards(IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update pricing profile' })
  @ApiResponse({ status: 200, description: 'Pricing profile updated' })
  async updatePricingProfile(
    @Body() updateDto: UpdatePricingProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return { message: 'Pricing update endpoint - to be implemented', dto: updateDto };
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get SND KPIs' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved' })
  async getKPIs(@Query() query?: { startDate?: string; endDate?: string }) {
    if (!query) {
      return this.metricsCollectorService.getKPIs();
    }
    const options: {
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (query.startDate) {
      options.startDate = new Date(query.startDate);
    }
    if (query.endDate) {
      options.endDate = new Date(query.endDate);
    }
    return this.metricsCollectorService.getKPIs(
      Object.keys(options).length > 0 ? options : undefined,
    );
  }
}
