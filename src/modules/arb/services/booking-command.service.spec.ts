import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingCommandService } from './booking-command.service';
import { BookingRepository } from '../repositories/booking.repository';
import { OfferRepository } from '../repositories/offer.repository';
import { EscrowEngineService } from './escrow-engine.service';
import { ArbNotificationAdapter } from '../adapters/notification.adapter';
import { ArbAuditLogger } from './audit-logger.service';
import { LoggerService } from '../../../core/services/logger.service';
import { BookingEntity, BookingStatus, EscrowStatus } from '../entities/booking.entity';
import { OfferEntity, OfferStatus } from '../entities/offer.entity';
import { CreateBookingDto } from '../dto/bookings/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/bookings/update-booking-status.dto';

describe('BookingCommandService', () => {
  let service: BookingCommandService;
  let bookingRepository: jest.Mocked<BookingRepository>;
  let offerRepository: jest.Mocked<OfferRepository>;
  let escrowEngine: jest.Mocked<EscrowEngineService>;
  let notificationAdapter: jest.Mocked<ArbNotificationAdapter>;
  let auditLogger: jest.Mocked<ArbAuditLogger>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockBookingRepository = {
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const mockOfferRepository = {
      findOne: jest.fn(),
    };

    const mockEscrowEngine = {
      createHold: jest.fn(),
      releaseEscrow: jest.fn(),
      refundEscrow: jest.fn(),
      captureEscrow: jest.fn(),
      calculateNoShowPenalty: jest.fn(),
    };

    const mockNotificationAdapter = {
      notifyBookingCreated: jest.fn(),
      notifyBookingConfirmed: jest.fn(),
      notifyBookingStatusChange: jest.fn(),
      notifyEscrowReleased: jest.fn(),
      notifyEscrowRefunded: jest.fn(),
    };

    const mockAuditLogger = {
      log: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingCommandService,
        {
          provide: BookingRepository,
          useValue: mockBookingRepository,
        },
        {
          provide: OfferRepository,
          useValue: mockOfferRepository,
        },
        {
          provide: EscrowEngineService,
          useValue: mockEscrowEngine,
        },
        {
          provide: ArbNotificationAdapter,
          useValue: mockNotificationAdapter,
        },
        {
          provide: ArbAuditLogger,
          useValue: mockAuditLogger,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<BookingCommandService>(BookingCommandService);
    bookingRepository = module.get(BookingRepository);
    offerRepository = module.get(OfferRepository);
    escrowEngine = module.get(EscrowEngineService);
    notificationAdapter = module.get(ArbNotificationAdapter);
    auditLogger = module.get(ArbAuditLogger);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create booking successfully', async () => {
      const createDto: CreateBookingDto = {
        offer_id: 'offer-123',
        customer_notes: 'ملاحظات تجريبية',
      };

      const offer = new OfferEntity();
      offer.id = 'offer-123';
      offer.partner_id = 'partner-123';
      offer.status = OfferStatus.ACTIVE;
      offer.deposit_amount = { amount: '10000', currency: 'YER' };

      const savedBooking = new BookingEntity();
      savedBooking.id = 'booking-123';
      savedBooking.offer_id = 'offer-123';
      savedBooking.status = BookingStatus.PENDING;

      offerRepository.findOne.mockResolvedValue(offer);
      bookingRepository.findByIdempotencyKey.mockResolvedValue(null);
      bookingRepository.create.mockResolvedValue(savedBooking);
      escrowEngine.createHold.mockResolvedValue({
        escrowId: 'escrow-123',
        transactionId: 'txn-123',
      });
      bookingRepository.update.mockResolvedValue(savedBooking);

      const result = await service.create('customer-123', createDto, 'idempotency-key-123');

      expect(result.id).toBe('booking-123');
      expect(escrowEngine.createHold).toHaveBeenCalled();
      expect(notificationAdapter.notifyBookingCreated).toHaveBeenCalled();
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if offer not found', async () => {
      const createDto: CreateBookingDto = {
        offer_id: 'non-existent',
      };

      offerRepository.findOne.mockResolvedValue(null);
      bookingRepository.findByIdempotencyKey.mockResolvedValue(null);

      await expect(
        service.create('customer-123', createDto, 'idempotency-key-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if offer not active', async () => {
      const createDto: CreateBookingDto = {
        offer_id: 'offer-123',
      };

      const offer = new OfferEntity();
      offer.id = 'offer-123';
      offer.status = OfferStatus.DRAFT;

      offerRepository.findOne.mockResolvedValue(offer);
      bookingRepository.findByIdempotencyKey.mockResolvedValue(null);

      await expect(
        service.create('customer-123', createDto, 'idempotency-key-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status successfully', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.customer_id = 'customer-123';
      booking.partner_id = 'partner-123';
      booking.status = BookingStatus.PENDING;

      const updateDto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
        notes: 'تم التأكيد',
      };

      bookingRepository.findOne.mockResolvedValue(booking);
      bookingRepository.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CONFIRMED,
      } as BookingEntity);

      const result = await service.updateStatus(
        'booking-123',
        'partner-123',
        updateDto,
        'idempotency-key-123',
      );

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(notificationAdapter.notifyBookingStatusChange).toHaveBeenCalled();
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      bookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          'non-existent',
          'user-123',
          { status: BookingStatus.CONFIRMED },
          'idempotency-key-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user not authorized', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.customer_id = 'customer-123';
      booking.partner_id = 'partner-123';

      bookingRepository.findOne.mockResolvedValue(booking);

      await expect(
        service.updateStatus(
          'booking-123',
          'unauthorized-user',
          { status: BookingStatus.CONFIRMED },
          'idempotency-key-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
