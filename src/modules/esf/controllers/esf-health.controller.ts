import { Controller, Get, Optional } from '@nestjs/common';
import { Public } from '../../../core/decorators/public.decorator';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('esf/health')
export class EsfHealthController {
  constructor(
    @Optional()
    @InjectEntityManager('default')
    private readonly em?: EntityManager,
  ) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'ESF service liveness probe' })
  liveness(): { status: string; service: string } {
    return { status: 'ok', service: 'esf' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'ESF service readiness probe' })
  async readiness(): Promise<{ status: string; service: string; checks?: Record<string, string> }> {
    const checks: Record<string, string> = {};

    if (this.em) {
      try {
        await this.em.getConnection().execute('SELECT 1');
        checks.db = 'ok';
      } catch (error) {
        checks.db = 'error';
        if (process.env.NODE_ENV === 'production') {
          return {
            status: 'error',
            service: 'esf',
            checks,
          };
        }
      }
    } else {
      checks.db = 'not_configured';
    }

    return {
      status: 'ok',
      service: 'esf',
      checks,
    };
  }
}
