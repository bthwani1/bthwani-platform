import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ReportingQueryService } from '../services/reporting-query.service';
import { ListListingsDto } from '../dto/reporting/list-listings.dto';
import { ListOrdersDto } from '../dto/reporting/list-orders.dto';
import { ListAbuseReportsDto } from '../dto/reporting/list-abuse-reports.dto';
import { GetMetricsDto } from '../dto/reporting/get-metrics.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { IdParamDto } from '../dto/common/id-param.dto';

@ApiTags('KNZ Reporting')
@Controller('knz/reporting')
@ApiBearerAuth()
export class ReportingQueryController {
  constructor(private readonly reportingQueryService: ReportingQueryService) {}

  @Get('listings')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'List listings with filtering' })
  @ApiResponse({ status: 200, description: 'Listings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listListings(@Query() query: ListListingsDto, @CurrentUser() user?: JwtPayload) {
    return this.reportingQueryService.listListings(query, user?.sub);
  }

  @Get('listings/:id')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getListing(@Param() params: IdParamDto, @CurrentUser() user?: JwtPayload) {
    return this.reportingQueryService.getListing(params.id);
  }

  @Get('orders')
  @Roles('admin', 'ops', 'support', 'finance')
  @ApiOperation({ summary: 'List orders with filtering' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listOrders(@Query() query: ListOrdersDto, @CurrentUser() user?: JwtPayload) {
    return this.reportingQueryService.listOrders(query, user?.sub);
  }

  @Get('orders/:id')
  @Roles('admin', 'ops', 'support', 'finance')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param() params: IdParamDto, @CurrentUser() user?: JwtPayload) {
    return this.reportingQueryService.getOrder(params.id, user?.sub);
  }

  @Get('abuse-reports')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'List abuse reports with filtering' })
  @ApiResponse({ status: 200, description: 'Abuse reports retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAbuseReports(@Query() query: ListAbuseReportsDto) {
    return this.reportingQueryService.listAbuseReports(query);
  }

  @Get('abuse-reports/:id')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Get abuse report by ID' })
  @ApiResponse({ status: 200, description: 'Abuse report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Abuse report not found' })
  async getAbuseReport(@Param() params: IdParamDto) {
    return this.reportingQueryService.getAbuseReport(params.id);
  }

  @Get('metrics')
  @Roles('admin', 'ops', 'finance', 'marketing')
  @ApiOperation({ summary: 'Get KNZ metrics and KPIs' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMetrics(@Query() query?: GetMetricsDto) {
    return this.reportingQueryService.getMetrics(query);
  }
}
