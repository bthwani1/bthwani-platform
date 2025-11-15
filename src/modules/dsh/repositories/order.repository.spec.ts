import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { OrderRepository } from './order.repository';
import { OrderEntity, OrderStatus } from '../entities/order.entity';

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let entityRepository: jest.Mocked<EntityRepository<OrderEntity>>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(() => {
    entityRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<EntityRepository<OrderEntity>>;

    entityManager = {
      persist: jest.fn(),
      flush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    repository = new OrderRepository(entityRepository, entityManager);
  });

  it('persists and flushes on create', async () => {
    const order = { id: 'order-1' } as OrderEntity;

    await repository.create(order);

    expect(entityManager.persist).toHaveBeenCalledWith(order);
    expect(entityManager.flush).toHaveBeenCalledTimes(1);
  });

  it('finds order by id', async () => {
    const order = { id: 'order-1' } as OrderEntity;
    entityRepository.findOne.mockResolvedValue(order);

    const result = await repository.findOne('order-1');

    expect(entityRepository.findOne).toHaveBeenCalledWith({ id: 'order-1' });
    expect(result).toBe(order);
  });

  it('builds query with cursor when listing by customer', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getResult: jest.fn().mockResolvedValue([]),
    };
    entityRepository.createQueryBuilder.mockReturnValue(qb as any);

    await repository.findByCustomerId('cust-1', '2025-01-01T00:00:00.000Z', 10);

    expect(entityRepository.createQueryBuilder).toHaveBeenCalledWith('o');
    expect(qb.where).toHaveBeenCalledWith({ customer_id: 'cust-1' });
    expect(qb.limit).toHaveBeenCalledWith(10);
    expect(qb.andWhere).toHaveBeenCalledWith('o.created_at < ?', [
      new Date('2025-01-01T00:00:00.000Z'),
    ]);
    expect(qb.getResult).toHaveBeenCalled();
  });

  it('builds query without cursor when none provided', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getResult: jest.fn().mockResolvedValue([]),
    };
    entityRepository.createQueryBuilder.mockReturnValue(qb as any);

    await repository.findByCustomerId('cust-1', undefined, 5);

    expect(qb.andWhere).not.toHaveBeenCalled();
    expect(qb.limit).toHaveBeenCalledWith(5);
  });

  it('uses default limit when not provided', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getResult: jest.fn().mockResolvedValue([]),
    };
    entityRepository.createQueryBuilder.mockReturnValue(qb as any);

    await repository.findByCustomerId('cust-2');

    expect(qb.limit).toHaveBeenCalledWith(20);
  });

  it('lists by status with custom limit', async () => {
    const orders = [{ id: 'order-1' }] as OrderEntity[];
    entityRepository.find.mockResolvedValue(orders);

    const result = await repository.findByStatus(OrderStatus.PENDING, 5);

    expect(entityRepository.find).toHaveBeenCalledWith(
      { status: OrderStatus.PENDING },
      { limit: 5, orderBy: { created_at: 'DESC' } },
    );
    expect(result).toBe(orders);
  });

  it('uses default limit when listing by status without explicit value', async () => {
    const orders = [{ id: 'order-2' }] as OrderEntity[];
    entityRepository.find.mockResolvedValue(orders);

    await repository.findByStatus(OrderStatus.CONFIRMED);

    expect(entityRepository.find).toHaveBeenCalledWith(
      { status: OrderStatus.CONFIRMED },
      { limit: 100, orderBy: { created_at: 'DESC' } },
    );
  });

  it('finds by idempotency key', async () => {
    await repository.findByIdempotencyKey('idem');
    expect(entityRepository.findOne).toHaveBeenCalledWith({ idempotency_key: 'idem' });
  });
});
