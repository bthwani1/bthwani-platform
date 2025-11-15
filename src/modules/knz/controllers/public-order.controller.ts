import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PublicOrderService } from '../services/public-order.service';
import { CreateKnzOrderDto } from '../dto/public/create-order.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { IdParamDto } from '../dto/common/id-param.dto';
import { KnzOrderStatus } from '../entities/knz-order.entity';

@ApiTags('KNZ Public Orders')
@Controller('knz/orders')
@ApiBearerAuth()
export class PublicOrderController {
  constructor(private readonly orderService: PublicOrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new KNZ order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 409, description: 'Insufficient quantity or conflict' })
  async createOrder(
    @Body() createDto: CreateKnzOrderDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.createOrder(createDto, user.sub, idempotencyKey);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.orderService.getOrder(params.id, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listOrders(
    @Query('status') status?: KnzOrderStatus,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('as_buyer') asBuyer?: boolean,
    @Query('as_seller') asSeller?: boolean,
    @CurrentUser() user?: JwtPayload,
  ) {
    if (!user) {
      throw new Error('Unauthorized');
    }
    return this.orderService.listOrders(user.sub, {
      status,
      cursor,
      limit,
      as_buyer: asBuyer,
      as_seller: asSeller,
    });
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund escrow for an order' })
  @ApiResponse({ status: 200, description: 'Escrow funded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order cannot be funded' })
  async fundEscrow(
    @Param() params: IdParamDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.fundEscrow(params.id, user.sub, idempotencyKey);
  }

  @Post(':id/dispatch-dls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch order to DLS for delivery' })
  @ApiResponse({ status: 200, description: 'Order dispatched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Order not eligible for DLS' })
  @ApiResponse({ status: 409, description: 'Order cannot be dispatched' })
  async dispatchDls(
    @Param() params: IdParamDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.dispatchDls(params.id, user.sub, idempotencyKey);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order cannot be cancelled' })
  async cancelOrder(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.orderService.cancelOrder(params.id, user.sub);
  }
}
