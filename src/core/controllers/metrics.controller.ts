import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { Public } from '../decorators/public.decorator';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get metrics in Prometheus format' })
  getMetrics(): string {
    return this.metricsService.exportPrometheus();
  }
}
