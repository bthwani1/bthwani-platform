import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TransferService } from '../services/transfer.service';
import { HoldService } from '../services/hold.service';
import { ProvidersService } from '../services/providers.service';
import { InternalTransferDto } from '../dto/internal-transfer.dto';
import { CreateHoldDto } from '../dto/create-hold.dto';
import { ReleaseHoldDto } from '../dto/release-hold.dto';
import { ProviderChargeDto } from '../dto/provider-charge.dto';
import { ProviderWebhookDto } from '../dto/webhook.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@ApiTags('Wallet Payments')
@Controller()
export class WltPaymentsController {
  constructor(
    private readonly transferService: TransferService,
    private readonly holdService: HoldService,
    private readonly providersService: ProvidersService,
  ) {}

  @Post('wallet/transfers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Internal transfer between WLT accounts' })
  @ApiResponse({ status: 201, description: 'Transfer completed successfully' })
  @HttpCode(HttpStatus.CREATED)
  async internalTransfer(
    @Body() dto: InternalTransferDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const transferRequest: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      currency?: string;
      serviceRef?: string;
      transactionRef?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {
      fromAccountId: dto.from_account_id,
      toAccountId: dto.to_account_id,
      amount: dto.amount,
    };
    if (dto.currency !== undefined) {
      transferRequest.currency = dto.currency;
    }
    if (dto.service_ref !== undefined) {
      transferRequest.serviceRef = dto.service_ref;
    }
    if (dto.description !== undefined) {
      transferRequest.description = dto.description;
    }
    if (dto.metadata !== undefined) {
      transferRequest.metadata = dto.metadata;
    }
    await this.transferService.transfer(transferRequest);
    return { status: 'success' };
  }

  @Post('wallet/holds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Create hold (escrow) on customer account' })
  @ApiResponse({ status: 201, description: 'Hold created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createHold(
    @Body() dto: CreateHoldDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const holdRequest: {
      accountId: string;
      amount: number;
      currency?: string;
      externalRef: string;
      serviceRef: string;
      releaseRules?: {
        release_days?: number;
        no_show_split?: number;
      };
      metadata?: Record<string, unknown>;
    } = {
      accountId: dto.account_id,
      amount: dto.amount,
      externalRef: dto.external_ref,
      serviceRef: dto.service_ref,
    };
    if (dto.currency !== undefined) {
      holdRequest.currency = dto.currency;
    }
    if (dto.release_rules !== undefined) {
      holdRequest.releaseRules = dto.release_rules;
    }
    if (dto.metadata !== undefined) {
      holdRequest.metadata = dto.metadata;
    }
    return this.holdService.createHold(holdRequest);
  }

  @Post('wallet/holds/:hold_id/release')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Release hold to balance or target accounts' })
  @ApiResponse({ status: 200, description: 'Hold released successfully' })
  async releaseHold(
    @Param('hold_id') holdId: string,
    @Body() dto: ReleaseHoldDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const releaseRequest: {
      holdId: string;
      releaseToBalance?: boolean;
      targetAccountId?: string;
      amount?: number;
      userId?: string;
    } = {
      holdId,
      userId: user.sub,
    };
    if (dto.release_to_balance !== undefined) {
      releaseRequest.releaseToBalance = dto.release_to_balance;
    }
    if (dto.target_account_id !== undefined) {
      releaseRequest.targetAccountId = dto.target_account_id;
    }
    if (dto.amount !== undefined) {
      releaseRequest.amount = dto.amount;
    }
    return this.holdService.releaseHold(releaseRequest);
  }

  @Post('pay/providers/:provider_code/charge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  @ApiOperation({ summary: 'Charge via external provider and map to wallet' })
  @ApiResponse({ status: 201, description: 'Charge initiated successfully' })
  @HttpCode(HttpStatus.CREATED)
  async providerCharge(
    @Param('provider_code') providerCode: string,
    @Body() dto: ProviderChargeDto,
    @Headers('idempotency-key') idempotencyKey: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const chargeRequest: {
      accountId: string;
      amount: number;
      currency?: string;
      providerCode: string;
      providerPayload?: Record<string, unknown>;
      serviceRef?: string;
      metadata?: Record<string, unknown>;
    } = {
      accountId: dto.account_id,
      amount: dto.amount,
      providerCode,
    };
    if (dto.currency !== undefined) {
      chargeRequest.currency = dto.currency;
    }
    if (dto.provider_payload !== undefined) {
      chargeRequest.providerPayload = dto.provider_payload;
    }
    if (dto.service_ref !== undefined) {
      chargeRequest.serviceRef = dto.service_ref;
    }
    if (dto.metadata !== undefined) {
      chargeRequest.metadata = dto.metadata;
    }
    return this.providersService.charge(chargeRequest);
  }

  @Post('pay/providers/:provider_code/webhook')
  @ApiOperation({ summary: 'Webhook for provider notifications' })
  @ApiResponse({ status: 204, description: 'Webhook processed successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async providerWebhook(
    @Param('provider_code') providerCode: string,
    @Body() dto: ProviderWebhookDto,
  ): Promise<void> {
    await this.providersService.handleWebhook(providerCode, dto);
  }
}
