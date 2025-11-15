import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingEntity, BookingStatus } from '../entities/booking.entity';
import { ListBookingsDto } from '../dto/bookings/list-bookings.dto';

@Injectable()
export class BookingQueryService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async findOne(id: string, userId: string, userRole?: string): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne(id);
    if (!booking) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/booking_not_found',
        title: 'Booking Not Found',
        status: 404,
        code: 'ARB-404-BOOKING-NOT-FOUND',
        detail: `Booking ${id} not found`,
      });
    }

    const isCustomer = booking.customer_id === userId;
    const isPartner = booking.partner_id === userId;
    const isAdmin = userRole === 'admin' || userRole === 'support' || userRole === 'finance';

    if (!isCustomer && !isPartner && !isAdmin) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this booking',
      });
    }

    return booking;
  }

  async findByCustomer(
    customerId: string,
    query: ListBookingsDto,
  ): Promise<{ items: BookingEntity[]; nextCursor?: string }> {
    const bookings = await this.bookingRepository.findByCustomer(customerId, {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit: query.limit ? query.limit + 1 : 21,
    });

    const hasMore = query.limit && bookings.length > query.limit;
    const items = hasMore ? bookings.slice(0, query.limit) : bookings;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findByPartner(
    partnerId: string,
    query: ListBookingsDto,
  ): Promise<{ items: BookingEntity[]; nextCursor?: string }> {
    const bookings = await this.bookingRepository.findByPartner(partnerId, {
      ...(query.status !== undefined && { status: query.status }),
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit: query.limit ? query.limit + 1 : 21,
    });

    const hasMore = query.limit && bookings.length > query.limit;
    const items = hasMore ? bookings.slice(0, query.limit) : bookings;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async findDisputes(
    query: ListBookingsDto,
  ): Promise<{ items: BookingEntity[]; nextCursor?: string }> {
    const bookings = await this.bookingRepository.findDisputed({
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit: query.limit ? query.limit + 1 : 21,
    });

    const hasMore = query.limit && bookings.length > query.limit;
    const items = hasMore ? bookings.slice(0, query.limit) : bookings;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }
}
