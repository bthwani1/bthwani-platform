import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { DshOrderChatService } from '../services/dsh-order-chat.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-PARTNER DSH Chat')
@Controller('dls/partner/orders/:order_id/chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class DshOrderChatController {
  constructor(private readonly chatService: DshOrderChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'List chat messages' })
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    const result = await this.chatService.getMessages(
      orderId,
      user.sub,
      cursor,
      limit ? Math.min(limit, 100) : 20,
    );

    return {
      items: result.items.map((msg) => ({
        id: msg.id,
        body: msg.body,
        sender_id: msg.sender_id,
        created_at: msg.created_at.toISOString(),
        is_read: msg.is_read,
      })),
      next_cursor: result.nextCursor || null,
    };
  }

  @Post('messages')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Send chat message' })
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { body: string },
  ): Promise<unknown> {
    const message = await this.chatService.createMessage(
      orderId,
      user.sub,
      { body: body.body },
      idempotencyKey,
    );

    return {
      id: message.id,
      body: message.body,
      sender_id: message.sender_id,
      created_at: message.created_at.toISOString(),
    };
  }

  @Post('read-ack')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Mark messages as read' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body?: { message_ids?: string[] },
  ): Promise<unknown> {
    await this.chatService.markAsRead(orderId, user.sub, body?.message_ids);
    return { acknowledged: true };
  }
}

