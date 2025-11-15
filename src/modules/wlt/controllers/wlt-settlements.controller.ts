import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { SettlementService } from '../services/settlement.service';
import { BatchStatus } from '../entities/settlement-batch.entity';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';

@ApiTags('Settlements')
@Controller('wallet/settlements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltSettlementsController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @ApiOperation({ summary: 'List settlement batches (cursor pagination)' })
  @ApiResponse({ status: 200, description: 'Batches retrieved successfully' })
  async listBatches(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: BatchStatus,
    @Query('partner_id') partnerId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    const options: {
      status?: BatchStatus;
      partnerId?: string;
      cursor?: string;
      limit?: number;
    } = {};
    if (status !== undefined) {
      options.status = status;
    }
    if (partnerId !== undefined) {
      options.partnerId = partnerId;
    }
    if (cursor !== undefined) {
      options.cursor = cursor;
    }
    if (limit !== undefined) {
      options.limit = limit;
    }
    return this.settlementService.listBatches(options);
  }

  @Post()
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Create settlement batch per criteria' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createBatch(
    @Body()
    dto: {
      partner_id?: string;
      period_start: string;
      period_end: string;
      criteria?: {
        partner_ids?: string[];
        service_refs?: string[];
        date_from?: string;
        date_to?: string;
      };
      metadata?: Record<string, unknown>;
    },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const batchRequest: {
      partnerId?: string;
      periodStart: Date;
      periodEnd: Date;
      criteria?: {
        partner_ids?: string[];
        service_refs?: string[];
        date_from?: string;
        date_to?: string;
      };
      metadata?: Record<string, unknown>;
    } = {
      periodStart: new Date(dto.period_start),
      periodEnd: new Date(dto.period_end),
    };
    if (dto.partner_id !== undefined) {
      batchRequest.partnerId = dto.partner_id;
    }
    if (dto.criteria !== undefined) {
      batchRequest.criteria = dto.criteria;
    }
    if (dto.metadata !== undefined) {
      batchRequest.metadata = dto.metadata;
    }
    return this.settlementService.createBatch(batchRequest);
  }

  @Post(':batch_id/approve')
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Approve settlement batch (dual-sign)' })
  @ApiResponse({ status: 200, description: 'Batch approved successfully' })
  async approveBatch(
    @Param('batch_id') batchId: string,
    @Body() dto: { is_first_approval: boolean },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.settlementService.approveBatch({
      batchId,
      approverId: user.sub,
      isFirstApproval: dto.is_first_approval,
    });
  }
}
