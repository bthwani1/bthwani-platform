import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SndRequestQueryService } from '../services/request-query.service';
import { SndChatService } from '../services/chat.service';
import { ListSupportCasesDto } from '../dto/support/list-cases.dto';
import { ApplySupportActionDto } from '../dto/support/apply-action.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RbacGuard } from '../../../core/guards/rbac.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';

@ApiTags('SND Support')
@Controller('api/snd/support')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SndSupportController {
  constructor(
    private readonly requestQueryService: SndRequestQueryService,
    private readonly chatService: SndChatService,
  ) {}

  @Get('cases')
  @ApiOperation({ summary: 'List support cases' })
  @ApiResponse({ status: 200, description: 'Cases listed' })
  async listCases(@Query() query: ListSupportCasesDto) {
    return this.requestQueryService.findSupportCases(query);
  }

  @Get('cases/:case_id')
  @ApiOperation({ summary: 'Get case details' })
  @ApiResponse({ status: 200, description: 'Case details' })
  async getCase(@Param('case_id') caseId: string) {
    const request = await this.requestQueryService.findRequest(caseId, 'system');
    const messages = await this.chatService.getAuditMessages(caseId);
    return {
      request,
      messages,
    };
  }

  @Post('actions')
  @UseGuards(IdempotencyGuard, StepUpGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply support action' })
  @ApiResponse({ status: 200, description: 'Action applied' })
  async applyAction(
    @Body() actionDto: ApplySupportActionDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return { message: 'Support action endpoint - to be implemented', dto: actionDto };
  }
}
