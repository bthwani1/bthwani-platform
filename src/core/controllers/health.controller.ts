import { Controller, Get, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { Public } from '../decorators/public.decorator';
import { MetricsService } from '../services/metrics.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @InjectEntityManager('default')
    private readonly em?: EntityManager,
    private readonly metricsService?: MetricsService,
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  liveness(): { status: string } {
    this.metricsService?.recordCounter('health.live.requests');
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness(): Promise<{ status: string; checks?: Record<string, string> }> {
    const checks: Record<string, string> = {};

    // Check database connection (if EntityManager is available)
    if (this.em) {
      try {
        await this.em.getConnection().execute('SELECT 1');
        checks.db = 'ok';
      } catch (error) {
        checks.db = 'error';
        // Don't fail readiness if DB is not available (for development)
        // In production, this should fail
        if (process.env.NODE_ENV === 'production') {
          return {
            status: 'error',
            checks,
          };
        }
      }
    } else {
      checks.db = 'not_configured';
    }

    // TODO: Add cache and queue checks
    // Example: checks.cache = await checkCache();
    // Example: checks.queue = await checkQueue();

    return {
      status: 'ok',
      checks,
    };
  }
}
