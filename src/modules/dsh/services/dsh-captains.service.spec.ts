import { Test, TestingModule } from '@nestjs/testing';
import { DshCaptainsService } from './dsh-captains.service';
import { OrderRepository } from '../repositories/order.repository';
import { LoggerService } from '../../../core/services/logger.service';
import { OrderEntity, OrderStatus, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DshCaptainsService', () => {
  let service: DshCaptainsService;
  let orderRepository: jest.Mocked<OrderRepository>;

  beforeEach(async () => {
    const mockOrderRepository = {
      findOne: jest.fn(),
      findByStatus: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DshCaptainsService,
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

    service = module.get<DshCaptainsService>(DshCaptainsService);
    orderRepository = module.get(OrderRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return captain profile', async () => {
      const captainId = 'captain-123';
      const result = await service.getProfile(captainId);

      expect(result).toEqual({
        id: captainId,
        status: 'active',
      });
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders for captain', async () => {
      const captainId = 'captain-123';
      const mockOrders: OrderEntity[] = Array(10).fill({
        id: 'order',
        captain_id: captainId,
        status: OrderStatus.ASSIGNED,
        created_at: new Date(),
      }) as OrderEntity[];

      orderRepository.findByStatus.mockResolvedValue(mockOrders);

      const result = await service.listOrders(captainId, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(orderRepository.findByStatus).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return order if found and assigned to captain', async () => {
      const captainId = 'captain-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        captain_id: captainId,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getOrder(captainId, orderId);

      expect(result).toBe(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrder('captain-123', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if order not assigned to captain', async () => {
      const mockOrder: OrderEntity = {
        id: 'order-123',
        captain_id: 'other-captain',
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.getOrder('captain-123', 'order-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('acceptOrder', () => {
    it('should accept order successfully', async () => {
      const captainId = 'captain-123';
      const orderId = 'order-123';
      const mockOrder: Partial<OrderEntity> = {
        id: orderId,
        customer_id: 'customer-123',
        status: OrderStatus.ASSIGNED,
        payment_method: PaymentMethod.WALLET,
        payment_status: PaymentStatus.PENDING,
        items: [],
        pricing: {
          subtotal: { amount: '1000', currency: 'YER' },
          total: { amount: '1000', currency: 'YER' },
        },
        created_at: new Date(),
        updated_at: new Date(),
      };
      const fullMockOrder = { ...mockOrder } as unknown as OrderEntity;

      orderRepository.findOne.mockResolvedValue(fullMockOrder);
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.acceptOrder(captainId, orderId);

      expect(result.captain_id).toBe(captainId);
      expect(result.status).toBe(OrderStatus.PICKED_UP);
    });

    it('should throw ForbiddenException if order not in assigned status', async () => {
      const mockOrder: OrderEntity = {
        id: 'order-123',
        status: OrderStatus.CONFIRMED,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.acceptOrder('captain-123', 'order-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('pickupOrder', () => {
    it('should mark order as picked up', async () => {
      const captainId = 'captain-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        captain_id: captainId,
        status: OrderStatus.ASSIGNED,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.pickupOrder(captainId, orderId);

      expect(result.status).toBe(OrderStatus.PICKED_UP);
    });
  });

  describe('deliverOrder', () => {
    it('should mark order as delivered', async () => {
      const captainId = 'captain-123';
      const orderId = 'order-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        captain_id: captainId,
        status: OrderStatus.PICKED_UP,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.deliverOrder(captainId, orderId, { signature: 'sig' });

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(result.delivered_at).toBeDefined();
    });
  });
});
