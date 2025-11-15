import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ExportService } from '../services/export.service';
import { AccountType } from '../entities/account.entity';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';

@ApiTags('Exports')
@Controller('wallet/exports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltExportsController {
  constructor(private readonly exportService: ExportService) {}

  @Post('statements')
  @UseGuards(StepUpGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Generate finance/HR statement export' })
  @ApiResponse({ status: 201, description: 'Export generated successfully' })
  @HttpCode(HttpStatus.CREATED)
  async exportStatement(
    @Body()
    dto: {
      account_ids?: string[];
      account_type?: AccountType;
      date_from: string;
      date_to: string;
      privacy_level?: 'masked' | 'unmasked';
    },
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const exportRequest: {
      accountIds?: string[];
      accountType?: AccountType;
      dateFrom: Date;
      dateTo: Date;
      privacyLevel?: 'masked' | 'unmasked';
      userId: string;
      userRole: string;
    } = {
      dateFrom: new Date(dto.date_from),
      dateTo: new Date(dto.date_to),
      userId: user.sub,
      userRole: (user.roles && user.roles.length > 0 && user.roles[0]) ? user.roles[0] : 'user',
    };
    if (dto.account_ids !== undefined) {
      exportRequest.accountIds = dto.account_ids;
    }
    if (dto.account_type !== undefined) {
      exportRequest.accountType = dto.account_type;
    }
    if (dto.privacy_level !== undefined) {
      exportRequest.privacyLevel = dto.privacy_level;
    }
    return this.exportService.exportStatement(exportRequest);
  }
}
