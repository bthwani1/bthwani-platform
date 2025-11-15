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
  BadRequestException,
} from '@nestjs/common';
import { BookingCommandService } from '../services/booking-command.service';
import { BookingQueryService } from '../services/booking-query.service';
import { CreateBookingDto } from '../dto/bookings/create-booking.dto';
import { ListBookingsDto } from '../dto/bookings/list-bookings.dto';
import { UpdateBookingStatusDto } from '../dto/bookings/update-booking-status.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Request } from 'express';

@Controller('api/arb/bookings')
export class ArbBookingsController {
  constructor(
    private readonly bookingCommandService: BookingCommandService,
    private readonly bookingQueryService: BookingQueryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @Body() createDto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.bookingCommandService.create(user.sub, createDto, idempotencyKey, req);
  }

  @Get(':booking_id')
  @UseGuards(JwtAuthGuard)
  async getBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.bookingQueryService.findOne(bookingId, user.sub, user.roles?.[0]);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listBookings(
    @Query() query: ListBookingsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.bookingQueryService.findByCustomer(user.sub, query);
  }

  @Post(':booking_id/status')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async updateBookingStatus(
    @Param('booking_id') bookingId: string,
    @Body() updateDto: UpdateBookingStatusDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.bookingCommandService.updateStatus(
      bookingId,
      user.sub,
      updateDto,
      idempotencyKey,
      req,
    );
  }
}

@Controller('api/arb/partner/bookings')
export class ArbPartnerBookingsController {
  constructor(
    private readonly bookingQueryService: BookingQueryService,
    private readonly bookingCommandService: BookingCommandService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listPartnerBookings(
    @Query() query: ListBookingsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.bookingQueryService.findByPartner(user.sub, query);
  }

  @Get(':booking_id')
  @UseGuards(JwtAuthGuard)
  async getPartnerBooking(
    @Param('booking_id') bookingId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.bookingQueryService.findOne(bookingId, user.sub, 'partner');
  }

  @Post(':booking_id/confirm')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async confirmBooking(
    @Param('booking_id') bookingId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Body() body?: { notes?: string },
    @Req() req?: Request,
  ): Promise<unknown> {
    return this.bookingCommandService.updateStatus(
      bookingId,
      user.sub,
      {
        status: 'confirmed' as any,
        notes: body?.notes,
      },
      idempotencyKey,
      req,
    );
  }

  @Post(':booking_id/reject')
  @UseGuards(JwtAuthGuard, IdempotencyGuard)
  @HttpCode(HttpStatus.OK)
  async rejectBooking(
    @Param('booking_id') bookingId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { reason: string; notes?: string },
    @Req() req?: Request,
  ): Promise<unknown> {
    if (!body.reason || body.reason.trim().length === 0) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/rejection_reason_required',
        title: 'Rejection Reason Required',
        status: 400,
        code: 'ARB-400-REJECTION-REASON-REQUIRED',
        detail: 'Rejection reason is required',
      });
    }

    return this.bookingCommandService.updateStatus(
      bookingId,
      user.sub,
      {
        status: 'cancelled' as any,
        notes: body.notes || body.reason,
      },
      idempotencyKey,
      req,
    );
  }
}
