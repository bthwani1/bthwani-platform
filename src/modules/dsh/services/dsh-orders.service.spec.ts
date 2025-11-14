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
import { DshIncentivesService } from './dsh-incentives.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DshOrdersService', () => {
  let service: DshOrdersService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let wltService: jest.Mocked<WltService>;
  let pricingService: jest.Mocked<PricingService>;
  let catalogService: jest.Mocked<CatalogService>;
  let incentivesService: jest.Mocked<DshIncentivesService>;

  beforeEach(async () => {
    const mockOrderRepository = {
      findByIdempotencyKey: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findByCustomerId: jest.fn(),
      created_at: new Date(),
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

    const mockIncentivesService = {
      applyIncentives: jest.fn(),
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
        {
          provide: DshIncentivesService,
          useValue: mockIncentivesService,
        },
      ],
    }).compile();

    service = module.get<DshOrdersService>(DshOrdersService);
    orderRepository = module.get(OrderRepository);
    wltService = module.get(WltService);
    pricingService = module.get(PricingService);
    catalogService = module.get(CatalogService);
    incentivesService = module.get(DshIncentivesService);
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
      incentivesService.applyIncentives.mockReturnValue({
        subtotalYer: 9000,
        deliveryFeeYer: 4000,
        totalYer: 13000,
        adjustments: [],
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
      expect(incentivesService.applyIncentives).toHaveBeenCalled();
      expect(wltService.authorizePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '13000',
        }),
      );
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

    it('throws conflict when catalog validation fails', async () => {
      const dto: CreateOrderDto = { items: [{ sku: 'INVALID', quantity: 1 }] };
      catalogService.validateProducts.mockResolvedValue({ valid: [], invalid: ['INVALID'] });
      await expect(service.createOrder(dto, 'key', 'cust')).rejects.toThrow(ConflictException);
    });

    it('skips wallet authorization when payment method is cash', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [{ sku: 'PROD-001', quantity: 1 }],
        payment_method: 'cash',
      };
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      catalogService.validateProducts.mockResolvedValue({ valid: ['PROD-001'], invalid: [] });
      pricingService.calculatePricing.mockResolvedValue({
        subtotal: { amount: '2000', currency: 'YER' },
        deliveryFee: { amount: '500', currency: 'YER' },
        total: { amount: '2500', currency: 'YER' },
        breakdown: [],
      });
      incentivesService.applyIncentives.mockReturnValue({
        subtotalYer: 2000,
        deliveryFeeYer: 500,
        totalYer: 2500,
        adjustments: [],
      });
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      await service.createOrder(createOrderDto, 'key', 'customer-123');

      expect(wltService.authorizePayment).not.toHaveBeenCalled();
    });

    it('throws conflict when wallet authorization fails', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [{ sku: 'PROD-001', quantity: 1 }],
      };
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      catalogService.validateProducts.mockResolvedValue({ valid: ['PROD-001'], invalid: [] });
      pricingService.calculatePricing.mockResolvedValue({
        subtotal: { amount: '2000', currency: 'YER' },
        deliveryFee: { amount: '500', currency: 'YER' },
        total: { amount: '2500', currency: 'YER' },
        breakdown: [],
      });
      incentivesService.applyIncentives.mockReturnValue({
        subtotalYer: 2000,
        deliveryFeeYer: 500,
        totalYer: 2500,
        adjustments: [],
      });
      wltService.authorizePayment.mockRejectedValue(new Error('fail'));

      await expect(service.createOrder(createOrderDto, 'key', 'customer-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('maps optional pricing and incentive fields when present', async () => {
      const dto: CreateOrderDto = {
        items: [
          {
            sku: 'PROD-777',
            quantity: 2,
            name: 'Test SKU',
            unit_price: { amount: '500', currency: 'USD' },
            addons: ['extra-cheese'],
            notes: 'No onions',
          },
        ],
        delivery_address: {
          city: 'Aden',
          location: { lat: 12.8, lon: 45.0 },
        },
        slot_id: 'slot-1',
        payment_method: 'wallet',
        subscription_plan_id: 'sub-1',
        coupon_code: 'SAVE10',
        redeem_points: 100,
        user_type: 'existing',
        notes: 'Leave at door',
        primary_category: 'groceries',
      };
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      catalogService.validateProducts.mockResolvedValue({ valid: ['PROD-777'], invalid: [] });
      pricingService.calculatePricing.mockResolvedValue({
        subtotal: { amount: '2000', currency: 'YER' },
        deliveryFee: { amount: '500', currency: 'YER' },
        total: { amount: '2500', currency: 'YER' },
        tax: { amount: '100', currency: 'YER' },
        breakdown: [
          {
            sku: 'PROD-777',
            quantity: 2,
            unitPrice: { amount: '500', currency: 'USD' },
            total: { amount: '1000', currency: 'USD' },
          },
        ],
      });
      incentivesService.applyIncentives.mockReturnValue({
        subtotalYer: 1800,
        deliveryFeeYer: 400,
        totalYer: 2200,
        adjustments: [
          {
            id: 'adj-1',
            label: 'Promo',
            source: 'coupon',
            target: 'basket_total',
            mode: 'discount',
            amountYer: 200,
          },
        ],
        guardrailViolations: ['max-discount'],
        appliedCouponCode: 'APPLIED10',
        pointsRedeemed: 50,
      });
      wltService.authorizePayment.mockResolvedValue({
        transactionId: 'txn-456',
        status: 'authorized',
        amount: '2200',
        currency: 'YER',
      });
      orderRepository.create.mockImplementation(async (order) => order as OrderEntity);

      const result = await service.createOrder(dto, 'idem-opt', 'cust-1');

      expect(result.pricing?.tax).toBeDefined();
      expect(result.pricing?.breakdown).toHaveLength(1);
      expect(result.pricing?.guardrail_violations).toEqual(['max-discount']);
      expect(result.pricing?.subscription_plan_id).toBe('sub-1');
      expect(result.pricing?.coupon_code).toBe('APPLIED10');
      expect(result.pricing?.points_redeemed).toBe(50);
      expect(orderRepository.create).toHaveBeenCalledWith(expect.any(OrderEntity));
    });

    it('throws conflict when wallet authorization status is not authorized', async () => {
      const dto: CreateOrderDto = {
        items: [{ sku: 'PROD-001', quantity: 1 }],
      };
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      catalogService.validateProducts.mockResolvedValue({ valid: ['PROD-001'], invalid: [] });
      pricingService.calculatePricing.mockResolvedValue({
        subtotal: { amount: '2000', currency: 'YER' },
        deliveryFee: { amount: '500', currency: 'YER' },
        total: { amount: '2500', currency: 'YER' },
        breakdown: [],
      });
      incentivesService.applyIncentives.mockReturnValue({
        subtotalYer: 2000,
        deliveryFeeYer: 500,
        totalYer: 2500,
        adjustments: [],
      });
      wltService.authorizePayment.mockResolvedValue({
        transactionId: 'txn-789',
        status: 'failed',
        amount: '2500',
        currency: 'YER',
      });

      await expect(service.createOrder(dto, 'idem-decline', 'cust-123')).rejects.toThrow(
        ConflictException,
      );
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

      await expect(service.getOrder('non-existent', 'customer-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when customer mismatch', async () => {
      orderRepository.findOne.mockResolvedValue({
        id: 'order',
        customer_id: 'different',
      } as OrderEntity);

      await expect(service.getOrder('order', 'customer-123')).rejects.toThrow(NotFoundException);
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

    it('returns cursor when more orders exist than requested limit', async () => {
      const customerId = 'customer-234';
      const limit = 2;
      const now = new Date();
      const orders: OrderEntity[] = [
        { id: 'o-1', customer_id: customerId, created_at: new Date(now.getTime() - 1000) } as OrderEntity,
        { id: 'o-2', customer_id: customerId, created_at: new Date(now.getTime() - 500) } as OrderEntity,
        { id: 'o-3', customer_id: customerId, created_at: now } as OrderEntity,
      ];
      orderRepository.findByCustomerId.mockResolvedValue(orders);

      const result = await service.listOrders({ limit }, customerId);
      const anchor = orders[limit - 1]!;
      const expectedCursor = anchor.created_at as Date;

      expect(result.items).toHaveLength(limit);
      expect(result.nextCursor).toBe(expectedCursor.toISOString());
    });

    it('throws when listing without customer context', async () => {
      await expect(service.listOrders({}, undefined)).rejects.toThrow(
        'Admin/partner listing not implemented',
      );
    });
  });
});
