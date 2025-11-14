import { Test, TestingModule } from '@nestjs/testing';
import { DshOrdersService } from './dsh-orders.service';
import { OrderRepository } from '../repositories/order.repository';
import { WltService } from '../../../shared/services/wlt.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { CatalogService } from '../../../shared/services/catalog.service';
import { LoggerService } from '../../../core/services/logger.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { OrderEntity } from '../entities/order.entity';

describe('DshOrdersService', () => {
  let service: DshOrdersService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let wltService: jest.Mocked<WltService>;
  let pricingService: jest.Mocked<PricingService>;
  let catalogService: jest.Mocked<CatalogService>;

  beforeEach(async () => {
    const mockOrderRepository = {
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findByCustomerId: jest.fn(),
    };

    const mockWltService = {
      authorizePayment: jest.fn(),
    };

    const mockPricingService = {
      calculatePricing: jest.fn(),
    };

    const mockCatalogService = {
      validateProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DshOrdersService,
        {
          provide: OrderRepository,
          useValue: mockOrderRepository,
        },
        {
          provide: WltService,
          useValue: mockWltService,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: CatalogService,
          useValue: mockCatalogService,
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

    service = module.get<DshOrdersService>(DshOrdersService);
    orderRepository = module.get(OrderRepository);
    wltService = module.get(WltService);
    pricingService = module.get(PricingService);
    catalogService = module.get(CatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [{ sku: 'PROD-001', quantity: 1 }],
        delivery_address: {},
      };
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';
      const customerId = 'customer-123';

      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      catalogService.validateProducts.mockResolvedValue({
        valid: ['PROD-001'],
        invalid: [],
      });
      pricingService.calculatePricing.mockResolvedValue({
        subtotal: { amount: '10000', currency: 'YER' },
        deliveryFee: { amount: '5000', currency: 'YER' },
        total: { amount: '15000', currency: 'YER' },
        breakdown: [],
      });
      wltService.authorizePayment.mockResolvedValue({
        transactionId: 'txn-123',
        status: 'authorized',
        amount: '15000',
        currency: 'YER',
      });
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.createOrder(createOrderDto, idempotencyKey, customerId);

      expect(result).toBeDefined();
      expect(result.customer_id).toBe(customerId);
      expect(orderRepository.create).toHaveBeenCalled();
    });

    it('should return existing order if idempotency key exists', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [{ sku: 'PROD-001', quantity: 1 }],
      };
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';
      const customerId = 'customer-123';
      const existingOrder: OrderEntity = {
        id: 'order-123',
        customer_id: customerId,
        idempotency_key: idempotencyKey,
      } as OrderEntity;

      orderRepository.findByIdempotencyKey.mockResolvedValue(existingOrder);

      const result = await service.createOrder(createOrderDto, idempotencyKey, customerId);

      expect(result).toBe(existingOrder);
      expect(orderRepository.findByIdempotencyKey).toHaveBeenCalledWith(idempotencyKey);
    });
  });

  describe('getOrder', () => {
    it('should return order if found', async () => {
      const orderId = 'order-123';
      const customerId = 'customer-123';
      const mockOrder: OrderEntity = {
        id: orderId,
        customer_id: customerId,
      } as OrderEntity;

      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getOrder(orderId, customerId);

      expect(result).toBe(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith(orderId);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrder('non-existent', 'customer-123')).rejects.toThrow();
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      const customerId = 'customer-123';
      const query: ListOrdersDto = { limit: 10 };
      const mockOrders: OrderEntity[] = Array(10).fill({
        id: 'order',
        customer_id: customerId,
      }) as OrderEntity[];

      orderRepository.findByCustomerId.mockResolvedValue(mockOrders);

      const result = await service.listOrders(query, customerId);

      expect(result.items).toHaveLength(10);
      expect(orderRepository.findByCustomerId).toHaveBeenCalled();
    });
  });
});
