import { Injectable } from '@nestjs/common';
import { OfferRepository } from '../repositories/offer.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { OfferStatus } from '../entities/offer.entity';
import { BookingStatus, EscrowStatus } from '../entities/booking.entity';

export interface ArbKpis {
  total_offers: number;
  active_offers: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  no_show_bookings: number;
  active_escrow_balance: number;
  escrow_on_hold: number;
  escrow_released: number;
  escrow_refunded: number;
  conversion_rate: number;
  no_show_rate: number;
  dispute_rate: number;
  avg_release_time_days: number;
}

@Injectable()
export class ArbMetricsCollectorService {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async getKpis(): Promise<ArbKpis> {
    const totalOffers = await this.offerRepository.countByStatus(OfferStatus.ACTIVE);
    const activeOffers = await this.offerRepository.countByStatus(OfferStatus.ACTIVE);

    const totalBookings = await this.bookingRepository.countByStatus(BookingStatus.PENDING);
    const pendingBookings = await this.bookingRepository.countByStatus(BookingStatus.PENDING);
    const confirmedBookings = await this.bookingRepository.countByStatus(BookingStatus.CONFIRMED);
    const completedBookings = await this.bookingRepository.countByStatus(BookingStatus.COMPLETED);
    const noShowBookings = await this.bookingRepository.countByStatus(BookingStatus.NO_SHOW);

    const escrowOnHold = await this.bookingRepository.countByEscrowStatus(EscrowStatus.HOLD);
    const escrowReleased = await this.bookingRepository.countByEscrowStatus(EscrowStatus.RELEASED);
    const escrowRefunded = await this.bookingRepository.countByEscrowStatus(EscrowStatus.REFUNDED);

    const conversionRate = activeOffers > 0 ? (totalBookings / activeOffers) * 100 : 0;
    const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0;
    const disputeRate = totalBookings > 0 ? 0 : 0;

    return {
      total_offers: totalOffers,
      active_offers: activeOffers,
      total_bookings: totalBookings,
      pending_bookings: pendingBookings,
      confirmed_bookings: confirmedBookings,
      completed_bookings: completedBookings,
      no_show_bookings: noShowBookings,
      active_escrow_balance: 0,
      escrow_on_hold: escrowOnHold,
      escrow_released: escrowReleased,
      escrow_refunded: escrowRefunded,
      conversion_rate: conversionRate,
      no_show_rate: noShowRate,
      dispute_rate: disputeRate,
      avg_release_time_days: 0,
    };
  }
}
