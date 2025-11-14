import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { DshPartnersService } from '../services/dsh-partners.service';

@ApiTags('APP-PARTNER')
@Controller('dls/partners')
@Roles('partner')
export class DshPartnersController {
  constructor(private readonly partnersService: DshPartnersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current partner profile' })
  async getProfile(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return this.partnersService.getProfile(user.sub);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List partner orders' })
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
    return this.partnersService.listOrders(user.sub, filters);
  }

  @Get('orders/:order_id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.partnersService.getOrder(user.sub, orderId);
  }

  @Post('orders/:order_id/prepare')
  @ApiOperation({ summary: 'Mark order as preparing' })
  async prepareOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.partnersService.prepareOrder(user.sub, orderId);
  }

  @Post('orders/:order_id/ready')
  @ApiOperation({ summary: 'Mark order as ready for pickup' })
  async markReady(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    return this.partnersService.markReady(user.sub, orderId);
  }
}
