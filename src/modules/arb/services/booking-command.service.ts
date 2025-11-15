import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingRepository } from '../repositories/booking.repository';
import { OfferRepository } from '../repositories/offer.repository';
import { BookingEntity, BookingStatus, EscrowStatus } from '../entities/booking.entity';
import { CreateBookingDto } from '../dto/bookings/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/bookings/update-booking-status.dto';
import { EscrowEngineService } from './escrow-engine.service';
import { ArbNotificationAdapter } from '../adapters/notification.adapter';
import { ArbAuditLogger } from './audit-logger.service';
import { LoggerService } from '../../../core/services/logger.service';
import { Request } from 'express';

@Injectable()
export class BookingCommandService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly offerRepository: OfferRepository,
    private readonly escrowEngine: EscrowEngineService,
    private readonly notificationAdapter: ArbNotificationAdapter,
    private readonly auditLogger: ArbAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async create(
    customerId: string,
    createDto: CreateBookingDto,
    idempotencyKey: string,
    req?: Request,
  ): Promise<BookingEntity> {
    const existing = await this.bookingRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return existing;
    }

    const offer = await this.offerRepository.findOne(createDto.offer_id);
    if (!offer) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/offer_not_found',
        title: 'Offer Not Found',
        status: 404,
        code: 'ARB-404-OFFER-NOT-FOUND',
        detail: `Offer ${createDto.offer_id} not found`,
      });
    }

    if (offer.status !== 'active') {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/offer_not_available',
        title: 'Offer Not Available',
        status: 400,
        code: 'ARB-400-OFFER-NOT-AVAILABLE',
        detail: 'Offer is not available for booking',
      });
    }

    const booking = new BookingEntity();
    booking.offer_id = offer.id;
    booking.customer_id = customerId;
    booking.partner_id = offer.partner_id;
    booking.status = BookingStatus.PENDING;
    booking.deposit_amount = {
      amount: offer.deposit_amount.amount,
      currency: offer.deposit_amount.currency || 'YER',
    };
    if (createDto.slot !== undefined) {
      booking.slot = createDto.slot;
    }
    if (createDto.customer_notes !== undefined) {
      booking.customer_notes = createDto.customer_notes;
    }
    booking.idempotency_key = idempotencyKey;

    const saved = await this.bookingRepository.create(booking);

    try {
      const escrowResult = await this.escrowEngine.createHold(saved, offer, idempotencyKey);
      saved.escrow_transaction_id = escrowResult.transactionId;
      saved.escrow_status = EscrowStatus.HOLD;
      await this.bookingRepository.update(saved);
    } catch (error) {
      this.logger.error(
        'Failed to create escrow hold',
        error instanceof Error ? error.stack : String(error),
        {
          bookingId: saved.id,
        },
      );
      saved.status = BookingStatus.CANCELLED;
      await this.bookingRepository.update(saved);
      throw error;
    }

    await this.notificationAdapter.notifyBookingCreated(customerId, offer.partner_id, saved.id);

    await this.auditLogger.log({
      entityType: 'booking',
      entityId: saved.id,
      action: 'create',
      userId: customerId,
      newValues: {
        offer_id: saved.offer_id,
        status: saved.status,
        escrow_status: saved.escrow_status,
      },
      ...(req && { request: req }),
    });

    return saved;
  }

  async updateStatus(
    bookingId: string,
    userId: string,
    updateDto: UpdateBookingStatusDto,
    idempotencyKey: string,
    req?: Request,
  ): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/booking_not_found',
        title: 'Booking Not Found',
        status: 404,
        code: 'ARB-404-BOOKING-NOT-FOUND',
        detail: `Booking ${bookingId} not found`,
      });
    }

    const isCustomer = booking.customer_id === userId;
    const isPartner = booking.partner_id === userId;

    if (!isCustomer && !isPartner) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to update this booking',
      });
    }

    const oldStatus = booking.status;
    const oldEscrowStatus = booking.escrow_status;

    booking.status = updateDto.status;

    if (updateDto.status === BookingStatus.CONFIRMED) {
      booking.confirmed_at = new Date();
      if (isPartner && updateDto.notes !== undefined) {
        booking.partner_notes = updateDto.notes;
      }
    } else if (updateDto.status === BookingStatus.ATTENDED) {
      booking.attended_at = new Date();
      await this.handleAttended(booking);
    } else if (updateDto.status === BookingStatus.NO_SHOW) {
      booking.no_show_at = new Date();
      await this.handleNoShow(booking);
    } else if (updateDto.status === BookingStatus.CANCELLED) {
      booking.cancelled_at = new Date();
      await this.handleCancelled(booking);
    } else if (updateDto.status === BookingStatus.COMPLETED) {
      booking.completed_at = new Date();
      await this.handleCompleted(booking);
    }

    const updated = await this.bookingRepository.update(booking);

    await this.notificationAdapter.notifyBookingStatusChange(
      booking.customer_id,
      booking.partner_id,
      booking.id,
      updateDto.status,
    );

    await this.auditLogger.log({
      entityType: 'booking',
      entityId: updated.id,
      action: 'status_change',
      userId,
      oldValues: {
        status: oldStatus,
        escrow_status: oldEscrowStatus,
      },
      newValues: {
        status: updated.status,
        escrow_status: updated.escrow_status,
      },
      ...(updateDto.notes !== undefined && { reason: updateDto.notes }),
      ...(req && { request: req }),
    });

    return updated;
  }

  private async handleAttended(booking: BookingEntity): Promise<void> {
    const offer = await this.offerRepository.findOne(booking.offer_id);
    if (!offer) return;

    await this.escrowEngine.releaseEscrow(booking, 'attended');
    booking.escrow_status = EscrowStatus.RELEASED;

    await this.notificationAdapter.notifyEscrowReleased(
      booking.customer_id,
      booking.id,
      booking.deposit_amount.amount,
    );
  }

  private async handleNoShow(booking: BookingEntity): Promise<void> {
    const offer = await this.offerRepository.findOne(booking.offer_id);
    if (!offer) return;

    const penalty = await this.escrowEngine.calculateNoShowPenalty(booking, offer);
    const penaltyAmount = parseInt(penalty.amount, 10);
    const depositAmount = parseInt(booking.deposit_amount.amount, 10);
    const refundAmount = depositAmount - penaltyAmount;

    if (refundAmount > 0) {
      await this.escrowEngine.refundEscrow(booking, 'no_show', refundAmount);
      await this.notificationAdapter.notifyEscrowRefunded(
        booking.customer_id,
        booking.id,
        refundAmount.toString(),
      );
    }

    if (penaltyAmount > 0) {
      await this.escrowEngine.captureEscrow(booking, penaltyAmount);
    }

    booking.escrow_status = EscrowStatus.PARTIAL_RELEASE;
  }

  private async handleCancelled(booking: BookingEntity): Promise<void> {
    if (booking.escrow_status === EscrowStatus.HOLD) {
      await this.escrowEngine.refundEscrow(booking, 'cancelled');
      booking.escrow_status = EscrowStatus.REFUNDED;

      await this.notificationAdapter.notifyEscrowRefunded(
        booking.customer_id,
        booking.id,
        booking.deposit_amount.amount,
      );
    }
  }

  private async handleCompleted(booking: BookingEntity): Promise<void> {
    if (booking.escrow_status === EscrowStatus.HOLD) {
      await this.escrowEngine.releaseEscrow(booking, 'completed');
      booking.escrow_status = EscrowStatus.RELEASED;

      await this.notificationAdapter.notifyEscrowReleased(
        booking.customer_id,
        booking.id,
        booking.deposit_amount.amount,
      );
    }
  }
}
