import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DshOrdersService } from '../services/dsh-orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { GetOrderDto } from '../dto/get-order.dto';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';

@Controller('dls/orders')
export class DshOrdersController {
  constructor(private readonly ordersService: DshOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    // Idempotency-Key is validated by IdempotencyGuard
    // Customer ID extracted from JWT token
    return this.ordersService.createOrder(createOrderDto, idempotencyKey, user.sub);
  }

  @Get(':order_id')
  async getOrder(@Param() params: GetOrderDto, @CurrentUser() user: JwtPayload): Promise<unknown> {
    // Extract customer ID from JWT token for RBAC check
    return this.ordersService.getOrder(params.order_id, user.sub);
  }

  @Get()
  async listOrders(
    @Query() query: ListOrdersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    // Extract customer ID from JWT token
    return this.ordersService.listOrders(query, user.sub);
  }
}
