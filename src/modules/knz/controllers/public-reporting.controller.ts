import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PublicAbuseReportService } from '../services/public-abuse-report.service';
import { CreateAbuseReportDto } from '../dto/public/create-abuse-report.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Public } from '../../../core/decorators/public.decorator';

@ApiTags('KNZ Public Reporting')
@Controller('knz/reports')
export class PublicReportingController {
  constructor(private readonly abuseReportService: PublicAbuseReportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({ summary: 'Report abuse for a listing' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async createReport(@Body() createDto: CreateAbuseReportDto, @CurrentUser() user?: JwtPayload) {
    return this.abuseReportService.createReport(createDto, user?.sub);
  }
}
