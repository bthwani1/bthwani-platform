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
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { BookingQueryService } from '../services/booking-query.service';
import { ArbChatService } from '../services/chat.service';
import { EscrowEngineService } from '../services/escrow-engine.service';
import { ListDisputesDto } from '../dto/support/list-disputes.dto';
import { ApplyResolutionDto, ResolutionType } from '../dto/support/apply-resolution.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';
import { Request } from 'express';
import { BookingRepository } from '../repositories/booking.repository';
import { ArbAuditLogger } from '../services/audit-logger.service';
import { BookingStatus, EscrowStatus } from '../entities/booking.entity';

@Controller('api/arb/support')
export class ArbSupportController {
  constructor(
    private readonly bookingQueryService: BookingQueryService,
    private readonly chatService: ArbChatService,
    private readonly escrowEngine: EscrowEngineService,
    private readonly bookingRepository: BookingRepository,
    private readonly auditLogger: ArbAuditLogger,
  ) {}

  @Get('disputes')
  @UseGuards(JwtAuthGuard)
  async listDisputes(@Query() query: ListDisputesDto): Promise<unknown> {
    return this.bookingQueryService.findDisputes(query);
  }

  @Get('bookings/:booking_id')
  @UseGuards(JwtAuthGuard)
  async getSupportBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const booking = await this.bookingQueryService.findOne(bookingId, user.sub, user.roles?.[0]);
    const chatMessages = await this.chatService.getAuditMessages(bookingId);
    return {
      booking,
      chat_messages: chatMessages,
    };
  }

  @Post('resolutions')
  @UseGuards(JwtAuthGuard, StepUpGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async applyResolution(
    @Body() resolutionDto: ApplyResolutionDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    const booking = await this.bookingRepository.findOne(resolutionDto.booking_id);
    if (!booking) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/booking_not_found',
        title: 'Booking Not Found',
        status: 404,
        code: 'ARB-404-BOOKING-NOT-FOUND',
        detail: `Booking ${resolutionDto.booking_id} not found`,
      });
    }

    if (resolutionDto.resolution_type === ResolutionType.FULL_REFUND) {
      await this.escrowEngine.refundEscrow(
        booking,
        'support_resolution',
        undefined,
        idempotencyKey,
      );
      booking.escrow_status = EscrowStatus.REFUNDED;
    } else if (resolutionDto.resolution_type === ResolutionType.PARTIAL_REFUND) {
      const refundAmount = resolutionDto.refund_amount
        ? parseInt(resolutionDto.refund_amount.amount, 10)
        : undefined;
      await this.escrowEngine.refundEscrow(
        booking,
        'support_resolution',
        refundAmount,
        idempotencyKey,
      );
      booking.escrow_status = EscrowStatus.PARTIAL_RELEASE;
    } else if (resolutionDto.resolution_type === ResolutionType.RELEASE_TO_PARTNER) {
      await this.escrowEngine.releaseEscrow(booking, 'support_resolution', idempotencyKey);
      booking.escrow_status = EscrowStatus.RELEASED;
    } else if (resolutionDto.resolution_type === ResolutionType.PARTIAL_RELEASE) {
      await this.escrowEngine.releaseEscrow(booking, 'support_resolution', idempotencyKey);
      booking.escrow_status = EscrowStatus.PARTIAL_RELEASE;
    }

    if (resolutionDto.new_status) {
      booking.status = resolutionDto.new_status as BookingStatus;
    }

    const updated = await this.bookingRepository.update(booking);

    await this.auditLogger.log({
      entityType: 'dispute',
      entityId: booking.id,
      action: 'dispute_resolve',
      userId: user.sub,
      newValues: {
        resolution_type: resolutionDto.resolution_type,
        new_status: resolutionDto.new_status,
      },
      reason: resolutionDto.reason,
      request: req,
    });

    return updated;
  }
}
