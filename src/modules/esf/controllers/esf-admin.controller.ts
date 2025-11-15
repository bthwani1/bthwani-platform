import { Controller, Get, Patch, Query, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfConfigRepository } from '../repositories/esf-config.repository';
import { EsfMetricsCollector } from '../services/esf-metrics-collector.service';
import { AdminSearchRequestsDto } from '../dto/admin/search-requests.dto';
import { GetConfigDto } from '../dto/admin/get-config.dto';
import { UpdateConfigDto } from '../dto/admin/update-config.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { RequiresStepUp } from '../../../core/guards/step-up.guard';

@Controller('esf/admin')
@Roles('admin_operator')
export class EsfAdminController {
  constructor(
    private readonly requestRepository: EsfRequestRepository,
    private readonly configRepository: EsfConfigRepository,
    private readonly metricsCollector: EsfMetricsCollector,
  ) {}

  @Get('requests')
  @RequiresStepUp()
  async searchRequests(@Query() query: AdminSearchRequestsDto): Promise<unknown> {
    const filters: {
      city?: string;
      status?: typeof query.status;
      aboType?: typeof query.abo_type;
      rhFactor?: typeof query.rh_factor;
      from?: Date;
      to?: Date;
      slaBreach?: boolean;
    } = {};
    if (query.city !== undefined) filters.city = query.city;
    if (query.status !== undefined) filters.status = query.status;
    if (query.abo_type !== undefined) filters.aboType = query.abo_type;
    if (query.rh_factor !== undefined) filters.rhFactor = query.rh_factor;
    if (query.from !== undefined) filters.from = new Date(query.from);
    if (query.to !== undefined) filters.to = new Date(query.to);
    if (query.sla_breach !== undefined) filters.slaBreach = query.sla_breach;

    const options: { cursor?: string; limit?: number } = {};
    if (query.cursor !== undefined) options.cursor = query.cursor;
    if (query.limit !== undefined) options.limit = query.limit;

    const requests = await this.requestRepository.search(
      {
        ...(query.city !== undefined && { city: query.city }),
        ...(query.status !== undefined && { status: query.status }),
        ...(query.abo_type !== undefined && { aboType: query.abo_type }),
        ...(query.rh_factor !== undefined && { rhFactor: query.rh_factor }),
        ...(query.from !== undefined && { from: new Date(query.from) }),
        ...(query.to !== undefined && { to: new Date(query.to) }),
        ...(query.sla_breach !== undefined && { slaBreach: query.sla_breach }),
      },
      {
        ...(query.cursor !== undefined && { cursor: query.cursor }),
        ...(query.limit !== undefined && { limit: query.limit }),
      },
    );

    const hasMore = query.limit && requests.length > query.limit;
    const items = hasMore ? requests.slice(0, query.limit) : requests;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  @Get('config')
  @RequiresStepUp()
  async getConfig(@Query() query: GetConfigDto): Promise<unknown> {
    if (query.scope) {
      return this.configRepository.findByScope(query.scope);
    }
    return this.configRepository.findByScope('global');
  }

  @Patch('config')
  @HttpCode(HttpStatus.OK)
  @RequiresStepUp()
  async updateConfig(
    @Body() updateDto: UpdateConfigDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const scope = updateDto.scope || 'global';
    return this.configRepository.upsert(scope, updateDto.key, updateDto.value, user.sub);
  }

  @Get('metrics')
  @RequiresStepUp()
  async getMetrics(): Promise<unknown> {
    return this.metricsCollector.getMetrics();
  }

  @Get('alerts')
  @RequiresStepUp()
  async getAlerts(): Promise<unknown> {
    return this.metricsCollector.checkAlerts();
  }
}
