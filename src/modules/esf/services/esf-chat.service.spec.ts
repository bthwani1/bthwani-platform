import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EsfChatService } from './esf-chat.service';
import { EsfChatMessageRepository } from '../repositories/esf-chat-message.repository';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfMatchRepository } from '../repositories/esf-match.repository';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import { LoggerService } from '../../../core/services/logger.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ListMessagesDto } from '../dto/list-messages.dto';
import {
  EsfRequestEntity,
  EsfRequestStatus,
  BloodType,
  RhFactor,
} from '../entities/esf-request.entity';
import { EsfChatMessageEntity, EsfChatMessageDirection } from '../entities/esf-chat-message.entity';
import { EsfMatchEntity, EsfMatchStatus } from '../entities/esf-match.entity';

describe('EsfChatService', () => {
  let service: EsfChatService;
  let chatMessageRepository: jest.Mocked<EsfChatMessageRepository>;
  let requestRepository: jest.Mocked<EsfRequestRepository>;
  let matchRepository: jest.Mocked<EsfMatchRepository>;
  let notificationAdapter: jest.Mocked<EsfNotificationAdapter>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockChatMessageRepository = {
      findByIdempotencyKey: jest.fn(),
      findByParticipants: jest.fn(),
      create: jest.fn(),
    };

    const mockRequestRepository = {
      findOne: jest.fn(),
    };

    const mockMatchRepository = {
      findByRequest: jest.fn(),
    };

    const mockNotificationAdapter = {
      notifyNewMessage: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsfChatService,
        {
          provide: EsfChatMessageRepository,
          useValue: mockChatMessageRepository,
        },
        {
          provide: EsfRequestRepository,
          useValue: mockRequestRepository,
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
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<EsfChatService>(EsfChatService);
    chatMessageRepository = module.get(EsfChatMessageRepository);
    requestRepository = module.get(EsfRequestRepository);
    matchRepository = module.get(EsfMatchRepository);
    notificationAdapter = module.get(EsfNotificationAdapter);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create message successfully', async () => {
      const requestId = 'request-123';
      const userId = 'requester-123';
      const createDto: CreateMessageDto = {
        body: 'Test message',
        is_urgent: false,
      };
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.requester_id = userId;

      const mockMatch = new EsfMatchEntity();
      mockMatch.donor_id = 'donor-123';
      mockMatch.status = EsfMatchStatus.ACCEPTED;

      const mockMessage = new EsfChatMessageEntity();
      mockMessage.id = 'message-123';
      mockMessage.body_encrypted = 'encrypted';

      chatMessageRepository.findByIdempotencyKey.mockResolvedValue(null);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      matchRepository.findByRequest.mockResolvedValue([mockMatch]);
      chatMessageRepository.create.mockResolvedValue(mockMessage);
      notificationAdapter.notifyNewMessage.mockResolvedValue(undefined);

      const result = await service.createMessage(requestId, userId, createDto, idempotencyKey);

      expect(result).toBeDefined();
      expect(chatMessageRepository.create).toHaveBeenCalled();
      expect(notificationAdapter.notifyNewMessage).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      const requestId = 'request-123';
      const userId = 'requester-123';
      const createDto: CreateMessageDto = {
        body: 'Test message',
      };
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';

      requestRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createMessage(requestId, userId, createDto, idempotencyKey),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMessages', () => {
    it('should return messages for requester', async () => {
      const requestId = 'request-123';
      const userId = 'requester-123';
      const query: ListMessagesDto = { limit: 50 };

      const mockRequest = new EsfRequestEntity();
      mockRequest.id = requestId;
      mockRequest.requester_id = userId;

      const mockMatch = new EsfMatchEntity();
      mockMatch.donor_id = 'donor-123';

      const mockMessage = new EsfChatMessageEntity();
      mockMessage.id = 'message-123';
      mockMessage.body_encrypted = 'encrypted';

      requestRepository.findOne.mockResolvedValue(mockRequest);
      matchRepository.findByRequest.mockResolvedValue([mockMatch]);
      chatMessageRepository.findByParticipants.mockResolvedValue([mockMessage]);

      const result = await service.getMessages(requestId, userId, query);

      expect(result.items).toBeDefined();
      expect(chatMessageRepository.findByParticipants).toHaveBeenCalled();
    });
  });
});
