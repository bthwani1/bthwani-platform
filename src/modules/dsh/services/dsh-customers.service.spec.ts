import { Test, TestingModule } from '@nestjs/testing';
import { DshCustomersService } from './dsh-customers.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('DshCustomersService', () => {
  let service: DshCustomersService;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DshCustomersService,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DshCustomersService>(DshCustomersService);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return customer profile', async () => {
      const customerId = 'customer-123';
      const result = await service.getProfile(customerId);

      expect(result).toEqual({
        id: customerId,
      });
      expect(logger.log).toHaveBeenCalledWith('Fetching customer profile', { customerId });
    });
  });

  describe('updateProfile', () => {
    it('should update customer profile', async () => {
      const customerId = 'customer-123';
      const updateData = {
        name: 'Test User',
        phone: '+967123456789',
      };

      const result = await service.updateProfile(customerId, updateData);

      expect(result).toEqual({
        id: customerId,
        updated: true,
      });
      expect(logger.log).toHaveBeenCalledWith('Updating customer profile', {
        customerId,
        updateData,
      });
    });
  });

  describe('listAddresses', () => {
    it('should return customer addresses', async () => {
      const customerId = 'customer-123';
      const result = await service.listAddresses(customerId);

      expect(result).toEqual({
        addresses: [],
      });
      expect(logger.log).toHaveBeenCalledWith('Fetching customer addresses', { customerId });
    });
  });

  describe('getPreferences', () => {
    it('should return customer preferences', async () => {
      const customerId = 'customer-123';
      const result = await service.getPreferences(customerId);

      expect(result).toEqual({
        language: 'ar',
        currency: 'YER',
        notifications: {},
      });
      expect(logger.log).toHaveBeenCalledWith('Fetching customer preferences', { customerId });
    });
  });
});
