import { Controller, Get, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CodPolicyService } from '../services/cod-policy.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@ApiTags('COD')
@Controller('wallet/cod')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltCodController {
  constructor(private readonly codPolicyService: CodPolicyService) {}

  @Get('captains/:captain_id/limits')
  @ApiOperation({ summary: 'Get COD float/exposure limits for a captain' })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  async getCodLimits(
    @Param('captain_id') captainId: string,
    @CurrentUser() user: JwtPayload,
    @Query('city_id') cityId?: string,
    @Query('service_ref') serviceRef?: string,
  ): Promise<unknown> {
    return this.codPolicyService.getCodLimits(captainId, cityId, serviceRef);
  }
}
