import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArbConfigRepository } from '../repositories/arb-config.repository';
import { ArbMetricsCollectorService } from '../services/metrics-collector.service';
import { GetConfigDto } from '../dto/admin/get-config.dto';
import { UpdateConfigDto } from '../dto/admin/update-config.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';
import { Request } from 'express';
import { ArbAuditLogger } from '../services/audit-logger.service';
import { ConfigScope } from '../entities/arb-config.entity';
import { ArbConfigEntity } from '../entities/arb-config.entity';

@Controller('api/arb/admin')
export class ArbAdminController {
  constructor(
    private readonly configRepository: ArbConfigRepository,
    private readonly metricsCollector: ArbMetricsCollectorService,
    private readonly auditLogger: ArbAuditLogger,
  ) {}

  @Get('config')
  @UseGuards(JwtAuthGuard)
  async getConfig(@Query() query: GetConfigDto): Promise<unknown> {
    if (query.scope) {
      const config = await this.configRepository.findByScope(
        query.scope as ConfigScope,
        query.scope_value,
      );
      return config || {};
    }
    return this.configRepository.findAllActive();
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, StepUpGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async updateConfig(
    @Body() updateDto: UpdateConfigDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    const existing = await this.configRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    const config = new ArbConfigEntity();
    config.scope = updateDto.scope;
    if (updateDto.scope_value !== undefined) {
      config.scope_value = updateDto.scope_value;
    }
    if (updateDto.release_days !== undefined) {
      config.release_days = updateDto.release_days;
    }
    if (updateDto.no_show_keep_pct !== undefined) {
      config.no_show_keep_pct = updateDto.no_show_keep_pct;
    }
    if (updateDto.no_show_cap !== undefined) {
      config.no_show_cap = {
        amount: updateDto.no_show_cap.amount,
        currency: updateDto.no_show_cap.currency || 'YER',
      };
    }
    config.is_active = updateDto.is_active !== undefined ? updateDto.is_active : true;
    config.created_by = user.sub;
    config.updated_by = user.sub;
    config.idempotency_key = idempotencyKey;

    const saved = await this.configRepository.create(config);

    await this.auditLogger.log({
      entityType: 'config',
      entityId: saved.id,
      action: 'config_update',
      userId: user.sub,
      newValues: {
        scope: saved.scope,
        scope_value: saved.scope_value,
        release_days: saved.release_days,
      },
      request: req,
    });

    return saved;
  }

  @Get('kpis')
  @UseGuards(JwtAuthGuard)
  async getKpis(): Promise<unknown> {
    return this.metricsCollector.getKpis();
  }
}
