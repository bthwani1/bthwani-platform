import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EsfRequestService } from './esf-request.service';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfMatchingService } from './esf-matching.service';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import { EsfAuditLogger } from './esf-audit-logger.service';
import { LoggerService } from '../../../core/services/logger.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import {
  EsfRequestEntity,
  EsfRequestStatus,
  BloodType,
  RhFactor,
} from '../entities/esf-request.entity';

describe('EsfRequestService', () => {
  let service: EsfRequestService;
  let requestRepository: jest.Mocked<EsfRequestRepository>;
  let matchingService: jest.Mocked<EsfMatchingService>;
  let notificationAdapter: jest.Mocked<EsfNotificationAdapter>;
  let auditLogger: jest.Mocked<EsfAuditLogger>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockRequestRepository = {
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findByRequester: jest.fn(),
    };

    const mockMatchingService = {
      matchRequest: jest.fn(),
      getMatchesForRequest: jest.fn(),
    };

    const mockNotificationAdapter = {
      notifyDonorMatch: jest.fn(),
      notifyRequesterConfirmation: jest.fn(),
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
        EsfRequestService,
        {
          provide: EsfRequestRepository,
          useValue: mockRequestRepository,
        },
        {
          provide: EsfMatchingService,
          useValue: mockMatchingService,
        },
        {
          provide: EsfNotificationAdapter,
          useValue: mockNotificationAdapter,
        },
        {
          provide: EsfAuditLogger,
          useValue: mockAuditLogger,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EsfRequestService>(EsfRequestService);
    requestRepository = module.get(EsfRequestRepository);
    matchingService = module.get(EsfMatchingService);
    notificationAdapter = module.get(EsfNotificationAdapter);
    auditLogger = module.get(EsfAuditLogger);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should create request successfully', async () => {
      const createDto: CreateRequestDto = {
        patient_name: 'Test Patient',
        hospital_name: 'Test Hospital',
        city: 'Sanaa',
        abo_type: BloodType.O,
        rh_factor: RhFactor.POSITIVE,
      };
      const requesterId = 'user-123';
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

      requestRepository.findByIdempotencyKey.mockResolvedValue(null);
      const mockRequest = new EsfRequestEntity();
      mockRequest.id = 'request-123';
      mockRequest.requester_id = requesterId;
      mockRequest.status = EsfRequestStatus.PENDING;
      requestRepository.create.mockResolvedValue(mockRequest);
      matchingService.matchRequest.mockResolvedValue(undefined);
      auditLogger.log.mockResolvedValue({} as any);

      const result = await service.createRequest(createDto, requesterId, idempotencyKey);

      expect(result).toBeDefined();
      expect(result.requester_id).toBe(requesterId);
      expect(requestRepository.findByIdempotencyKey).toHaveBeenCalledWith(idempotencyKey);
      expect(requestRepository.create).toHaveBeenCalled();
      expect(matchingService.matchRequest).toHaveBeenCalledWith(mockRequest.id);
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should return existing request if idempotency key exists', async () => {
      const createDto: CreateRequestDto = {
        patient_name: 'Test Patient',
        hospital_name: 'Test Hospital',
        city: 'Sanaa',
        abo_type: BloodType.O,
        rh_factor: RhFactor.POSITIVE,
      };
      const requesterId = 'user-123';
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

      const existingRequest = new EsfRequestEntity();
      existingRequest.id = 'request-123';
      requestRepository.findByIdempotencyKey.mockResolvedValue(existingRequest);

      const result = await service.createRequest(createDto, requesterId, idempotencyKey);

      expect(result).toBe(existingRequest);
      expect(requestRepository.create).not.toHaveBeenCalled();
      expect(matchingService.matchRequest).not.toHaveBeenCalled();
    });
  });

  describe('getRequest', () => {
    it('should return request for requester', async () => {
      const requestId = 'request-123';
      const userId = 'user-123';

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.requester_id = userId;
      requestRepository.findOne.mockResolvedValue(mockRequest);

      const result = await service.getRequest(requestId, userId);

      expect(result).toBe(mockRequest);
      expect(requestRepository.findOne).toHaveBeenCalledWith(requestId);
    });

    it('should throw NotFoundException if request not found', async () => {
      const requestId = 'request-123';
      const userId = 'user-123';

      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.getRequest(requestId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listRequests', () => {
    it('should return paginated requests', async () => {
      const requesterId = 'user-123';
      const options = { cursor: undefined, limit: 20 };

      const mockRequests = [new EsfRequestEntity(), new EsfRequestEntity()];
      requestRepository.findByRequester.mockResolvedValue(mockRequests);

      const result = await service.listRequests(requesterId, options);

      expect(result.items).toHaveLength(2);
      expect(requestRepository.findByRequester).toHaveBeenCalledWith(requesterId, options);
    });
  });

  describe('cancelRequest', () => {
    it('should cancel request successfully', async () => {
      const requestId = 'request-123';
      const requesterId = 'user-123';

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.requester_id = requesterId;
      mockRequest.status = EsfRequestStatus.PENDING;
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.create.mockResolvedValue(mockRequest);
      auditLogger.log.mockResolvedValue({} as any);

      const result = await service.cancelRequest(requestId, requesterId);

      expect(result.status).toBe(EsfRequestStatus.CANCELLED);
      expect(result.cancelled_at).toBeDefined();
    });

    it('should throw ConflictException if not requester', async () => {
      const requestId = 'request-123';
      const requesterId = 'user-123';

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.requester_id = 'other-user';
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.cancelRequest(requestId, requesterId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
