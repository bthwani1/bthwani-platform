import { Test, TestingModule } from '@nestjs/testing';
import { ArbMetricsCollectorService } from './metrics-collector.service';
import { BookingRepository } from '../repositories/booking.repository';
import { OfferRepository } from '../repositories/offer.repository';
import { BookingStatus, EscrowStatus } from '../entities/booking.entity';
import { OfferStatus } from '../entities/offer.entity';

describe('ArbMetricsCollectorService', () => {
  let service: ArbMetricsCollectorService;
  let bookingRepository: jest.Mocked<BookingRepository>;
  let offerRepository: jest.Mocked<OfferRepository>;

  beforeEach(async () => {
    const mockBookingRepository = {
      countByStatus: jest.fn(),
      countByEscrowStatus: jest.fn(),
    };

    const mockOfferRepository = {
      countByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArbMetricsCollectorService,
        {
          provide: BookingRepository,
          useValue: mockBookingRepository,
        },
        {
          provide: OfferRepository,
          useValue: mockOfferRepository,
        },
      ],
    }).compile();

    service = module.get<ArbMetricsCollectorService>(ArbMetricsCollectorService);
    bookingRepository = module.get(BookingRepository);
    offerRepository = module.get(OfferRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKpis', () => {
    it('should return KPIs successfully', async () => {
      bookingRepository.countByStatus.mockResolvedValue(10);
      bookingRepository.countByEscrowStatus.mockResolvedValue(5);
      offerRepository.countByStatus.mockResolvedValue(20);

      const kpis = await service.getKpis();

      expect(kpis).toHaveProperty('total_offers');
      expect(kpis).toHaveProperty('active_offers');
      expect(kpis).toHaveProperty('total_bookings');
      expect(kpis).toHaveProperty('pending_bookings');
      expect(kpis).toHaveProperty('confirmed_bookings');
      expect(kpis).toHaveProperty('held_escrows');
    });
  });
});
