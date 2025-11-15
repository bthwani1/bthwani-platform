import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EsfMatchingService } from './esf-matching.service';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfDonorProfileRepository } from '../repositories/esf-donor-profile.repository';
import { EsfMatchRepository } from '../repositories/esf-match.repository';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import { EsfMetricsCollector } from './esf-metrics-collector.service';
import { LoggerService } from '../../../core/services/logger.service';
import {
  EsfRequestEntity,
  EsfRequestStatus,
  BloodType,
  RhFactor,
} from '../entities/esf-request.entity';
import { EsfDonorProfileEntity } from '../entities/esf-donor-profile.entity';
import { EsfMatchEntity, EsfMatchStatus } from '../entities/esf-match.entity';

describe('EsfMatchingService', () => {
  let service: EsfMatchingService;
  let requestRepository: jest.Mocked<EsfRequestRepository>;
  let donorProfileRepository: jest.Mocked<EsfDonorProfileRepository>;
  let matchRepository: jest.Mocked<EsfMatchRepository>;
  let notificationAdapter: jest.Mocked<EsfNotificationAdapter>;
  let metricsCollector: jest.Mocked<EsfMetricsCollector>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockRequestRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockDonorProfileRepository = {
      findAvailableDonors: jest.fn(),
      findAvailableDonorsInRadius: jest.fn(),
    };

    const mockMatchRepository = {
      findByRequest: jest.fn(),
      findByRequestAndDonor: jest.fn(),
      findByDonor: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockNotificationAdapter = {
      notifyDonorMatch: jest.fn(),
      notifyRequesterConfirmation: jest.fn(),
    };

    const mockMetricsCollector = {
      recordMatchTime: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsfMatchingService,
        {
          provide: EsfRequestRepository,
          useValue: mockRequestRepository,
        },
        {
          provide: EsfDonorProfileRepository,
          useValue: mockDonorProfileRepository,
        },
        {
          provide: EsfMatchRepository,
          useValue: mockMatchRepository,
        },
        {
          provide: EsfNotificationAdapter,
          useValue: mockNotificationAdapter,
        },
        {
          provide: EsfMetricsCollector,
          useValue: mockMetricsCollector,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EsfMatchingService>(EsfMatchingService);
    requestRepository = module.get(EsfRequestRepository);
    donorProfileRepository = module.get(EsfDonorProfileRepository);
    matchRepository = module.get(EsfMatchRepository);
    notificationAdapter = module.get(EsfNotificationAdapter);
    metricsCollector = module.get(EsfMetricsCollector);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('matchRequest', () => {
    it('should match request with available donors', async () => {
      const requestId = 'request-123';
      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.status = EsfRequestStatus.PENDING;
      mockRequest.abo_type = BloodType.O;
      mockRequest.rh_factor = RhFactor.POSITIVE;
      mockRequest.city = 'Sanaa';
      mockRequest.requester_id = 'requester-123';

      const mockDonor = new EsfDonorProfileEntity();
      mockDonor.user_id = 'donor-123';
      mockDonor.abo_type = BloodType.O;
      mockDonor.rh_factor = RhFactor.POSITIVE;
      mockDonor.is_available = true;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      donorProfileRepository.findAvailableDonors.mockResolvedValue([mockDonor]);
      matchRepository.findByRequestAndDonor.mockResolvedValue(null);
      const mockMatch = new EsfMatchEntity();
      mockMatch.id = 'match-123';
      matchRepository.create.mockResolvedValue(mockMatch);
      requestRepository.create.mockResolvedValue(mockRequest);
      notificationAdapter.notifyDonorMatch.mockResolvedValue(undefined);
      metricsCollector.recordMatchTime.mockResolvedValue(undefined);

      await service.matchRequest(requestId);

      expect(donorProfileRepository.findAvailableDonors).toHaveBeenCalled();
      expect(matchRepository.create).toHaveBeenCalled();
      expect(notificationAdapter.notifyDonorMatch).toHaveBeenCalled();
    });

    it('should not match if request is not pending', async () => {
      const requestId = 'request-123';
      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.status = EsfRequestStatus.MATCHED;

      requestRepository.findOne.mockResolvedValue(mockRequest);

      await service.matchRequest(requestId);

      expect(donorProfileRepository.findAvailableDonors).not.toHaveBeenCalled();
    });
  });

  describe('acceptMatch', () => {
    it('should accept match successfully', async () => {
      const matchId = 'match-123';
      const donorId = 'donor-123';

      const mockMatch = new EsfMatchEntity();
      mockMatch.id = matchId;
      mockMatch.donor_id = donorId;
      mockMatch.status = EsfMatchStatus.PENDING;
      mockMatch.request_id = 'request-123';

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = 'request-123';
      mockRequest.requester_id = 'requester-123';

      matchRepository.findOne.mockResolvedValue(mockMatch);
      matchRepository.create.mockResolvedValue(mockMatch);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.create.mockResolvedValue(mockRequest);
      notificationAdapter.notifyRequesterConfirmation.mockResolvedValue(undefined);

      const result = await service.acceptMatch(matchId, donorId);

      expect(result.status).toBe(EsfMatchStatus.ACCEPTED);
      expect(mockRequest.status).toBe(EsfRequestStatus.CONFIRMED);
    });

    it('should throw NotFoundException if match not found', async () => {
      const matchId = 'match-123';
      const donorId = 'donor-123';

      matchRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptMatch(matchId, donorId)).rejects.toThrow(NotFoundException);
    });
  });
});
