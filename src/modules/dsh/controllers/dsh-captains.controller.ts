import { Controller, Get, Param, Query, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { DshCaptainsService } from '../services/dsh-captains.service';

@ApiTags('APP-CAPTAIN')
@Controller('dls/captains')
@Roles('captain')
export class DshCaptainsController {
  constructor(private readonly captainsService: DshCaptainsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current captain profile' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.captainsService.getProfile(user.sub);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List assigned orders' })
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    const filters: { status?: string; cursor?: string; limit?: number } = {};
    if (status) filters.status = status;
    if (cursor) filters.cursor = cursor;
    if (limit) filters.limit = limit;
    return this.captainsService.listOrders(user.sub, filters);
  }

  @Get('orders/:order_id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.captainsService.getOrder(user.sub, orderId);
  }

  @Patch('orders/:order_id/accept')
  @ApiOperation({ summary: 'Accept order assignment' })
  async acceptOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.captainsService.acceptOrder(user.sub, orderId);
  }

  @Patch('orders/:order_id/pickup')
  @ApiOperation({ summary: 'Mark order as picked up' })
  async pickupOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.captainsService.pickupOrder(user.sub, orderId);
  }

  @Patch('orders/:order_id/deliver')
  @ApiOperation({ summary: 'Mark order as delivered' })
  async deliverOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Body() body: { signature?: string; photo?: string },
  ): Promise<unknown> {
    return this.captainsService.deliverOrder(user.sub, orderId, body);
  }
}
