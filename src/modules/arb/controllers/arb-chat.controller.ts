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
  UnauthorizedException,
} from '@nestjs/common';
import { ArbChatService } from '../services/chat.service';
import { CreateChatMessageDto } from '../dto/chat/create-message.dto';
import { ListChatMessagesDto } from '../dto/chat/list-messages.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';

@Controller('api/arb/bookings/:booking_id/chat')
export class ArbChatController {
  constructor(private readonly chatService: ArbChatService) {}

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  async listMessages(
    @Param('booking_id') bookingId: string,
    @Query() query: ListChatMessagesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.getMessages(bookingId, user.sub, query);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Param('booking_id') bookingId: string,
    @Body() createDto: CreateChatMessageDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.chatService.createMessage(bookingId, user.sub, createDto, idempotencyKey);
  }

  @Post('escalate')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async escalateChat(
    @Param('booking_id') bookingId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return { booking_id: bookingId, escalated: true, escalated_by: user.sub };
  }
}

@Controller('api/arb/bookings/:booking_id/chat')
export class ArbChatAuditController {
  constructor(private readonly chatService: ArbChatService) {}

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  async getAuditMessages(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const hasRole = user.roles?.some((r) => r === 'support' || r === 'admin');
    if (!hasRole) {
      throw new UnauthorizedException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to access audit messages',
      });
    }
    return this.chatService.getAuditMessages(bookingId);
  }
}
