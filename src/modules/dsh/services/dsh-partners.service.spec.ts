import { Test, TestingModule } from '@nestjs/testing';
import { DshPartnersService } from './dsh-partners.service';
import { OrderRepository } from '../repositories/order.repository';
import { LoggerService } from '../../../core/services/logger.service';
import { OrderEntity, OrderStatus } from '../entities/order.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DshPartnersService', () => {
  let service: DshPartnersService;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(async () => {
    const mockOrderRepository = {
      findOne: jest.fn(),
      findByStatus: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DshPartnersService,
        {
          provide: OrderRepository,
          useValue: mockOrderRepository,
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DshPartnersService>(DshPartnersService);
    orderRepository = module.get(OrderRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return partner profile', async () => {
      const partnerId = 'partner-123';
      const result = await service.getProfile(partnerId);

      expect(result).toEqual({
        id: partnerId,
        status: 'active',
      });
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders for partner', async () => {
      const partnerId = 'partner-123';
      const mockOrders: OrderEntity[] = Array(10).fill({
        id: 'order',
        partner_id: partnerId,
        status: OrderStatus.CONFIRMED,
        created_at: new Date(),
      }) as OrderEntity[];

      orderRepository.findByStatus.mockResolvedValue(mockOrders);

      const result = await service.listOrders(partnerId, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(orderRepository.findByStatus).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return order if found and assigned to partner', async () => {
      const partnerId = 'partner-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        partner_id: partnerId,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getOrder(partnerId, orderId);

      expect(result).toBe(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrder('partner-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if order not assigned to partner', async () => {
      const mockOrder: OrderEntity = {
        id: 'order-123',
        partner_id: 'other-partner',
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.getOrder('partner-123', 'order-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('prepareOrder', () => {
    it('should mark order as preparing', async () => {
      const partnerId = 'partner-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        partner_id: partnerId,
        status: OrderStatus.CONFIRMED,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.prepareOrder(partnerId, orderId);

      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('should throw ForbiddenException if order not in correct status', async () => {
      const mockOrder: OrderEntity = {
        id: 'order-123',
        partner_id: 'partner-123',
        status: OrderStatus.DELIVERED,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.prepareOrder('partner-123', 'order-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markReady', () => {
    it('should mark order as ready', async () => {
      const partnerId = 'partner-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        partner_id: partnerId,
        status: OrderStatus.PREPARING,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.markReady(partnerId, orderId);

      expect(result.status).toBe(OrderStatus.READY);
    });

    it('should throw ForbiddenException if order not in preparing status', async () => {
      const mockOrder: OrderEntity = {
        id: 'order-123',
        partner_id: 'partner-123',
        status: OrderStatus.CONFIRMED,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.markReady('partner-123', 'order-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
