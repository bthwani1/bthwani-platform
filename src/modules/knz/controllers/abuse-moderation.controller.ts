import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AbuseModerationService } from '../services/abuse-moderation.service';
import { ReportingQueryService } from '../services/reporting-query.service';
import { ModerateListingDto } from '../dto/abuse/moderate-listing.dto';
import { ResolveReportDto } from '../dto/abuse/resolve-report.dto';
import { ListAbuseReportsDto } from '../dto/reporting/list-abuse-reports.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { IdParamDto } from '../dto/common/id-param.dto';
import { Request } from 'express';

@ApiTags('KNZ Abuse Moderation')
@Controller('knz/admin/abuse')
@ApiBearerAuth()
export class AbuseModerationController {
  constructor(
    private readonly abuseModerationService: AbuseModerationService,
    private readonly reportingQueryService: ReportingQueryService,
  ) {}

  @Get('reports')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'List abuse reports' })
  @ApiResponse({ status: 200, description: 'Abuse reports retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAbuseReports(@Query() query: ListAbuseReportsDto) {
    return this.reportingQueryService.listAbuseReports(query);
  }

  @Get('reports/:id')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Get abuse report by ID' })
  @ApiResponse({ status: 200, description: 'Abuse report retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Abuse report not found' })
  async getAbuseReport(@Param() params: IdParamDto) {
    return this.abuseModerationService.getAbuseReport(params.id);
  }

  @Post('listings/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Moderate a listing' })
  @ApiResponse({ status: 200, description: 'Listing moderated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async moderateListing(
    @Param() params: IdParamDto,
    @Body() moderateDto: ModerateListingDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.abuseModerationService.moderateListing(
      params.id,
      moderateDto,
      user.sub,
      user.email || '',
      request,
    );
  }

  @Put('reports/:id/resolve')
  @Roles('admin', 'ops', 'support')
  @ApiOperation({ summary: 'Resolve an abuse report' })
  @ApiResponse({ status: 200, description: 'Abuse report resolved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Abuse report not found' })
  async resolveReport(
    @Param() params: IdParamDto,
    @Body() resolveDto: ResolveReportDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.abuseModerationService.resolveReport(
      params.id,
      resolveDto,
      user.sub,
      user.email || '',
      request,
    );
  }
}
