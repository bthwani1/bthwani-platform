import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EscrowEngineService } from './escrow-engine.service';
import { ArbWalletAdapter } from '../adapters/wallet.adapter';
import { ArbConfigRepository } from '../repositories/arb-config.repository';
import { LoggerService } from '../../../core/services/logger.service';
import { BookingEntity, BookingStatus, EscrowStatus } from '../entities/booking.entity';
import { OfferEntity, OfferStatus, DepositPolicy } from '../entities/offer.entity';
import { ConfigScope } from '../entities/arb-config.entity';

describe('EscrowEngineService', () => {
  let service: EscrowEngineService;
  let walletAdapter: jest.Mocked<ArbWalletAdapter>;
  let configRepository: jest.Mocked<ArbConfigRepository>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockWalletAdapter = {
      createEscrowHold: jest.fn(),
      releaseEscrow: jest.fn(),
      refundEscrow: jest.fn(),
      captureEscrow: jest.fn(),
    };

    const mockConfigRepository = {
      findByScope: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowEngineService,
        {
          provide: ArbWalletAdapter,
          useValue: mockWalletAdapter,
        },
        {
          provide: ArbConfigRepository,
          useValue: mockConfigRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EscrowEngineService>(EscrowEngineService);
    walletAdapter = module.get(ArbWalletAdapter);
    configRepository = module.get(ArbConfigRepository);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHold', () => {
    it('should create escrow hold successfully', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.customer_id = 'customer-123';
      booking.partner_id = 'partner-123';
      booking.deposit_amount = { amount: '10000', currency: 'YER' };

      const offer = new OfferEntity();
      offer.id = 'offer-123';

      walletAdapter.createEscrowHold.mockResolvedValue({
        escrow_id: 'escrow-123',
        transaction_id: 'txn-123',
      });

      const result = await service.createHold(booking, offer, 'idempotency-key-123');

      expect(result.escrowId).toBe('escrow-123');
      expect(result.transactionId).toBe('txn-123');
      expect(booking.escrow_transaction_id).toBe('txn-123');
      expect(booking.escrow_status).toBe(EscrowStatus.HOLD);
      expect(walletAdapter.createEscrowHold).toHaveBeenCalledWith(
        expect.objectContaining({
          booking_id: 'booking-123',
          amount_yer: 10000,
          currency: 'YER',
        }),
        'idempotency-key-123',
      );
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow successfully', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.escrow_transaction_id = 'txn-123';
      booking.escrow_status = EscrowStatus.HOLD;

      walletAdapter.releaseEscrow.mockResolvedValue({
        released_amount_yer: 10000,
      });

      await service.releaseEscrow(booking, 'attended', 'idempotency-key-123');

      expect(booking.escrow_status).toBe(EscrowStatus.RELEASED);
      expect(walletAdapter.releaseEscrow).toHaveBeenCalledWith(
        expect.objectContaining({
          escrow_id: 'booking-123',
          transaction_id: 'txn-123',
          reason_code: 'attended',
        }),
        'idempotency-key-123',
      );
    });

    it('should throw error if no escrow transaction', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.escrow_transaction_id = null;

      await expect(
        service.releaseEscrow(booking, 'attended', 'idempotency-key-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundEscrow', () => {
    it('should refund escrow successfully', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.escrow_transaction_id = 'txn-123';
      booking.deposit_amount = { amount: '10000', currency: 'YER' };

      walletAdapter.refundEscrow.mockResolvedValue({
        refunded_amount_yer: 10000,
      });

      await service.refundEscrow(booking, 'cancelled', undefined, 'idempotency-key-123');

      expect(booking.escrow_status).toBe(EscrowStatus.REFUNDED);
    });

    it('should handle partial refund', async () => {
      const booking = new BookingEntity();
      booking.id = 'booking-123';
      booking.escrow_transaction_id = 'txn-123';
      booking.deposit_amount = { amount: '10000', currency: 'YER' };

      walletAdapter.refundEscrow.mockResolvedValue({
        refunded_amount_yer: 7000,
      });

      await service.refundEscrow(booking, 'no_show', 7000, 'idempotency-key-123');

      expect(booking.escrow_status).toBe(EscrowStatus.PARTIAL_RELEASE);
    });
  });

  describe('calculateNoShowPenalty', () => {
    it('should calculate penalty based on config', async () => {
      const booking = new BookingEntity();
      booking.deposit_amount = { amount: '10000', currency: 'YER' };

      const offer = new OfferEntity();
      offer.category_id = 'cat-123';

      configRepository.findByScope.mockResolvedValue({
        no_show_keep_pct: 30,
        no_show_cap: { amount: '3000', currency: 'YER' },
      } as any);

      const result = await service.calculateNoShowPenalty(booking, offer);

      expect(result.amount).toBe('3000');
      expect(result.currency).toBe('YER');
    });

    it('should apply minimum penalty cap', async () => {
      const booking = new BookingEntity();
      booking.deposit_amount = { amount: '10000', currency: 'YER' };

      const offer = new OfferEntity();
      offer.category_id = 'cat-123';

      configRepository.findByScope.mockResolvedValue({
        no_show_keep_pct: 100,
      } as any);

      const result = await service.calculateNoShowPenalty(booking, offer);

      expect(parseInt(result.amount, 10)).toBeLessThanOrEqual(2000);
    });
  });
});
