import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SsotBridgeService } from '../services/ssot-bridge.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { RequiresStepUp } from '../../../core/guards/step-up.guard';
import { IdParamDto } from '../dto/common/id-param.dto';
import { Request } from 'express';

@ApiTags('KNZ SSOT Bridge')
@Controller('knz/admin/ssot')
@ApiBearerAuth()
export class SsotBridgeController {
  constructor(private readonly ssotBridgeService: SsotBridgeService) {}

  @Get('decisions')
  @Roles('admin', 'ssot_governor')
  @ApiOperation({ summary: 'Get KNZ-related SSOT decisions' })
  @ApiResponse({ status: 200, description: 'Decisions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDecisions(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.ssotBridgeService.getDecisions({ type, status, limit });
  }

  @Get('parity/:artifact_type/:artifact_id')
  @Roles('admin', 'ssot_governor')
  @ApiOperation({ summary: 'Get parity/trace/gaps for KNZ artifacts' })
  @ApiResponse({ status: 200, description: 'Parity information retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getParity(
    @Param('artifact_type') artifactType: string,
    @Param('artifact_id') artifactId: string,
  ) {
    return this.ssotBridgeService.getParity(artifactType, artifactId);
  }

  @Get('guards')
  @Roles('admin', 'ssot_governor', 'security')
  @ApiOperation({ summary: 'Get guard statuses for KNZ' })
  @ApiResponse({ status: 200, description: 'Guard statuses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getGuardStatuses() {
    return this.ssotBridgeService.getGuardStatuses();
  }

  @Post('decisions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('ssot_governor')
  @RequiresStepUp()
  @ApiOperation({ summary: 'Approve an SSOT decision' })
  @ApiResponse({ status: 200, description: 'Decision approved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or Step-Up required' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Decision not found' })
  async approveDecision(
    @Param() params: IdParamDto,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.ssotBridgeService.approveDecision(params.id, user.sub, user.email || '', reason);
  }
}
