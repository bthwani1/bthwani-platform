# DSH Module

Delivery & Shopping Platform service module.

## Structure

```
dsh/
  controllers/     # HTTP request handlers
  services/        # Business logic
  repositories/    # Data access layer (TODO)
  entities/        # Domain entities (TODO)
  dto/             # Data Transfer Objects for validation
  mappers/         # Entity ↔ DTO mappers (TODO)
```

## Current Status

- ✅ Basic module structure created
- ✅ Orders controller scaffolded
- ✅ DTOs for order operations
- ⏳ Repository layer (pending)
- ⏳ Entity definitions (pending)
- ⏳ Business logic implementation (pending)
- ⏳ Guards (Idempotency, RBAC, Step-Up) (pending)
- ⏳ Integration with WLT service (pending)

## API Routes

- `POST /api/dls/orders` - Create order (requires Idempotency-Key)
- `GET /api/dls/orders/:order_id` - Get order details
- `GET /api/dls/orders` - List orders with pagination

## Next Steps

1. Implement repository layer with MikroORM
2. Define entity models
3. Implement business logic in services
4. Add guards (Idempotency, RBAC, Step-Up)
5. Integrate with WLT for payments
6. Add remaining controllers per OpenAPI spec

