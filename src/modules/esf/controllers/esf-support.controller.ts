import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfChatMessageRepository } from '../repositories/esf-chat-message.repository';
import { EsfAuditLogger } from '../services/esf-audit-logger.service';
import { EsfRequestStatus } from '../entities/esf-request.entity';
import { GetRequestDto } from '../dto/get-request.dto';
import { ListMessagesDto } from '../dto/list-messages.dto';
import { ApplyActionDto, SupportActionType } from '../dto/support/apply-action.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { RequiresStepUp } from '../../../core/guards/step-up.guard';

@Controller('esf/support')
@Roles('support_agent')
export class EsfSupportController {
  constructor(
    private readonly requestRepository: EsfRequestRepository,
    private readonly chatMessageRepository: EsfChatMessageRepository,
    private readonly auditLogger: EsfAuditLogger,
  ) {}

  @Get('requests/:request_id')
  async getRequest(@Param() params: GetRequestDto): Promise<unknown> {
    const request = await this.requestRepository.findOne(params.request_id);
    if (!request) {
      return null;
    }

    return {
      id: request.id,
      patient_name: request.patient_name,
      hospital_name: request.hospital_name,
      city: request.city,
      district: request.district,
      abo_type: request.abo_type,
      rh_factor: request.rh_factor,
      status: request.status,
      created_at: request.created_at,
      is_abuse: request.is_abuse,
      abuse_reason: request.abuse_reason,
    };
  }

  @Get('requests/:request_id/messages')
  async listMessages(
    @Param() params: GetRequestDto,
    @Query() query: ListMessagesDto,
  ): Promise<unknown> {
    const messages = await this.chatMessageRepository.findByRequest(params.request_id, {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.limit !== undefined && { limit: query.limit }),
    });

    const hasMore = query.limit && messages.length > query.limit;
    const items = hasMore ? messages.slice(0, query.limit) : messages;
    const maskedItems = items.map((msg) => ({
      id: msg.id,
      sender_id: msg.sender_id.substring(0, 2) + '***',
      recipient_id: msg.recipient_id.substring(0, 2) + '***',
      direction: msg.direction,
      body_encrypted: '***',
      phone_masked: msg.phone_masked,
      links_masked: msg.links_masked,
      is_read: msg.is_read,
      is_urgent: msg.is_urgent,
      created_at: msg.created_at,
    }));

    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: maskedItems,
      ...(nextCursor && { nextCursor }),
    };
  }

  @Post('actions')
  @HttpCode(HttpStatus.OK)
  @RequiresStepUp()
  async applyAction(
    @Body() applyDto: ApplyActionDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    if (applyDto.action_type === SupportActionType.MARK_ABUSE) {
      const request = await this.requestRepository.findOne(applyDto.entity_id);
      if (request) {
        request.is_abuse = true;
        request.abuse_reason = applyDto.reason ?? null;
        await this.requestRepository.create(request);
      }
    } else if (applyDto.action_type === SupportActionType.CLOSE_REQUEST) {
      const request = await this.requestRepository.findOne(applyDto.entity_id);
      if (request) {
        request.status = EsfRequestStatus.CLOSED;
        request.closed_at = new Date();
        await this.requestRepository.create(request);
      }
    }

    await this.auditLogger.log({
      entityType: applyDto.entity_type as any,
      entityId: applyDto.entity_id,
      action: 'apply_action' as any,
      userId: user.sub,
      ...(user.email && { userEmail: user.email }),
      newValues: {
        action_type: applyDto.action_type,
        ...(applyDto.reason !== undefined && { reason: applyDto.reason }),
        ...(applyDto.notes !== undefined && { notes: applyDto.notes }),
      },
    });

    return { success: true, action_type: applyDto.action_type, entity_id: applyDto.entity_id };
  }
}
