import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferRepository } from '../repositories/offer.repository';
import { ArbAuditLogger } from './audit-logger.service';
import { LoggerService } from '../../../core/services/logger.service';
import { OfferEntity, OfferStatus, DepositPolicy } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/offers/create-offer.dto';
import { UpdateOfferDto } from '../dto/offers/update-offer.dto';

describe('OfferService', () => {
  let service: OfferService;
  let offerRepository: jest.Mocked<OfferRepository>;
  let auditLogger: jest.Mocked<ArbAuditLogger>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockOfferRepository = {
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      search: jest.fn(),
      findByPartner: jest.fn(),
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
        OfferService,
        {
          provide: OfferRepository,
          useValue: mockOfferRepository,
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

    service = module.get<OfferService>(OfferService);
    offerRepository = module.get(OfferRepository);
    auditLogger = module.get(ArbAuditLogger);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create offer successfully', async () => {
      const createDto: CreateOfferDto = {
        title_ar: 'عرض تجريبي',
        title_en: 'Test Offer',
        price: { amount: '50000', currency: 'YER' },
        deposit_amount: { amount: '10000', currency: 'YER' },
      };

      const savedOffer = new OfferEntity();
      savedOffer.id = 'offer-123';
      savedOffer.title_ar = createDto.title_ar;
      savedOffer.title_en = createDto.title_en;
      savedOffer.status = OfferStatus.DRAFT;

      offerRepository.findByIdempotencyKey.mockResolvedValue(null);
      offerRepository.create.mockResolvedValue(savedOffer);

      const result = await service.create('partner-123', createDto, 'idempotency-key-123');

      expect(result.id).toBe('offer-123');
      expect(offerRepository.create).toHaveBeenCalled();
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should return existing offer if idempotency key matches', async () => {
      const createDto: CreateOfferDto = {
        title_ar: 'عرض تجريبي',
        title_en: 'Test Offer',
        price: { amount: '50000', currency: 'YER' },
        deposit_amount: { amount: '10000', currency: 'YER' },
      };

      const existingOffer = new OfferEntity();
      existingOffer.id = 'offer-123';

      offerRepository.findByIdempotencyKey.mockResolvedValue(existingOffer);

      const result = await service.create('partner-123', createDto, 'idempotency-key-123');

      expect(result.id).toBe('offer-123');
      expect(offerRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return offer if found', async () => {
      const offer = new OfferEntity();
      offer.id = 'offer-123';

      offerRepository.findOne.mockResolvedValue(offer);

      const result = await service.findOne('offer-123');

      expect(result.id).toBe('offer-123');
    });

    it('should throw NotFoundException if offer not found', async () => {
      offerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update offer successfully', async () => {
      const offer = new OfferEntity();
      offer.id = 'offer-123';
      offer.partner_id = 'partner-123';
      offer.title_ar = 'عنوان قديم';
      offer.title_en = 'Old Title';
      offer.status = OfferStatus.DRAFT;

      const updateDto: UpdateOfferDto = {
        title_ar: 'عنوان جديد',
      };

      const updatedOffer = { ...offer, title_ar: updateDto.title_ar };

      offerRepository.findOne.mockResolvedValue(offer);
      offerRepository.update.mockResolvedValue(updatedOffer as OfferEntity);

      const result = await service.update(
        'offer-123',
        'partner-123',
        updateDto,
        'idempotency-key-123',
      );

      expect(result.title_ar).toBe('عنوان جديد');
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if partner does not own offer', async () => {
      const offer = new OfferEntity();
      offer.id = 'offer-123';
      offer.partner_id = 'partner-123';

      offerRepository.findOne.mockResolvedValue(offer);

      await expect(
        service.update('offer-123', 'different-partner', {}, 'idempotency-key-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
