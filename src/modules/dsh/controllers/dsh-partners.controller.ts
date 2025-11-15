import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { Roles } from '../../../core/guards/rbac.guard';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { DshPartnersService } from '../services/dsh-partners.service';

@ApiTags('APP-PARTNER')
@Controller('dls/partner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class DshPartnersController {
  constructor(private readonly partnersService: DshPartnersService) {}

  @Get('profile')
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

  @Post('orders/:order_id/accept')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Accept order for fulfillment' })
  @HttpCode(HttpStatus.OK)
  async acceptOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.partnersService.acceptOrder(user.sub, orderId, idempotencyKey);
  }

  @Post('orders/:order_id/reject')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Reject order with reason' })
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { reason: string },
  ): Promise<unknown> {
    return this.partnersService.rejectOrder(user.sub, orderId, idempotencyKey, body.reason);
  }

  @Post('orders/:order_id/prepare')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Mark order as preparing' })
  @HttpCode(HttpStatus.OK)
  async prepareOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.partnersService.prepareOrder(user.sub, orderId, idempotencyKey);
  }

  @Post('orders/:order_id/ready')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Mark order as ready for pickup' })
  @HttpCode(HttpStatus.OK)
  async markReady(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.partnersService.markReady(user.sub, orderId, idempotencyKey);
  }

  @Post('orders/:order_id/handoff')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Handoff order to platform captain' })
  @HttpCode(HttpStatus.OK)
  async handoffOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    return this.partnersService.handoffOrder(user.sub, orderId, idempotencyKey);
  }
}
