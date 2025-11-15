import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ExportService } from '../services/export.service';
import { ExportDataDto } from '../dto/export/export-data.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { Request } from 'express';

@ApiTags('KNZ Export')
@Controller('knz/export')
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles('admin', 'finance', 'ops')
  @ApiOperation({ summary: 'Export KNZ data (masked)' })
  @ApiResponse({ status: 202, description: 'Export request accepted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden or Privacy Export Guard violation' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async exportData(
    @Body() exportDto: ExportDataDto,
    @CurrentUser() user: JwtPayload,
    @Req() request: Request,
  ) {
    return this.exportService.exportData(exportDto, user.sub, user.email || '', request);
  }
}
