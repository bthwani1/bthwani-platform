import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { ArbWalletAdapter } from '../adapters/wallet.adapter';
import { ArbConfigRepository } from '../repositories/arb-config.repository';
import { BookingEntity, BookingStatus, EscrowStatus } from '../entities/booking.entity';
import { OfferEntity, DepositPolicy } from '../entities/offer.entity';
import { ConfigScope } from '../entities/arb-config.entity';

@Injectable()
export class EscrowEngineService {
  constructor(
    private readonly walletAdapter: ArbWalletAdapter,
    private readonly configRepository: ArbConfigRepository,
    private readonly logger: LoggerService,
  ) {}

  async createHold(
    booking: BookingEntity,
    offer: OfferEntity,
    idempotencyKey: string,
  ): Promise<{ escrowId: string; transactionId: string }> {
    const amountYer = parseInt(booking.deposit_amount.amount, 10);

    const response = await this.walletAdapter.createEscrowHold(
      {
        booking_id: booking.id,
        customer_id: booking.customer_id,
        partner_id: booking.partner_id,
        amount_yer: amountYer,
        currency: booking.deposit_amount.currency || 'YER',
      },
      idempotencyKey,
    );

    booking.escrow_transaction_id = response.transaction_id;
    booking.escrow_status = EscrowStatus.HOLD;

    return {
      escrowId: response.escrow_id,
      transactionId: response.transaction_id,
    };
  }

  async releaseEscrow(
    booking: BookingEntity,
    reasonCode: string,
    idempotencyKey?: string,
  ): Promise<void> {
    if (!booking.escrow_transaction_id) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/no_escrow',
        title: 'No Escrow',
        status: 400,
        code: 'ARB-400-NO-ESCROW',
        detail: 'Booking does not have an escrow transaction',
      });
    }

    const response = await this.walletAdapter.releaseEscrow(
      {
        escrow_id: booking.id,
        transaction_id: booking.escrow_transaction_id,
        reason_code: reasonCode,
      },
      idempotencyKey,
    );

    booking.escrow_status = EscrowStatus.RELEASED;
    this.logger.log('Escrow released', {
      bookingId: booking.id,
      transactionId: booking.escrow_transaction_id,
      releasedAmount: response.released_amount_yer,
    });
  }

  async refundEscrow(
    booking: BookingEntity,
    reasonCode: string,
    amountYer?: number,
    idempotencyKey?: string,
  ): Promise<void> {
    if (!booking.escrow_transaction_id) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/no_escrow',
        title: 'No Escrow',
        status: 400,
        code: 'ARB-400-NO-ESCROW',
        detail: 'Booking does not have an escrow transaction',
      });
    }

    const response = await this.walletAdapter.refundEscrow(
      {
        escrow_id: booking.id,
        transaction_id: booking.escrow_transaction_id,
        reason_code: reasonCode,
        ...(amountYer !== undefined && { amount_yer: amountYer }),
      },
      idempotencyKey,
    );

    if (amountYer && amountYer < parseInt(booking.deposit_amount.amount, 10)) {
      booking.escrow_status = EscrowStatus.PARTIAL_RELEASE;
    } else {
      booking.escrow_status = EscrowStatus.REFUNDED;
    }

    this.logger.log('Escrow refunded', {
      bookingId: booking.id,
      transactionId: booking.escrow_transaction_id,
      refundedAmount: response.refunded_amount_yer,
    });
  }

  async captureEscrow(
    booking: BookingEntity,
    amountYer?: number,
    idempotencyKey?: string,
  ): Promise<void> {
    if (!booking.escrow_transaction_id) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/no_escrow',
        title: 'No Escrow',
        status: 400,
        code: 'ARB-400-NO-ESCROW',
        detail: 'Booking does not have an escrow transaction',
      });
    }

    const response = await this.walletAdapter.captureEscrow(
      {
        escrow_id: booking.id,
        transaction_id: booking.escrow_transaction_id,
        ...(amountYer !== undefined && { amount_yer: amountYer }),
      },
      idempotencyKey,
    );

    booking.escrow_status = EscrowStatus.CAPTURED;
    this.logger.log('Escrow captured', {
      bookingId: booking.id,
      transactionId: booking.escrow_transaction_id,
      capturedAmount: response.captured_amount_yer,
    });
  }

  async calculateNoShowPenalty(
    booking: BookingEntity,
    offer: OfferEntity,
  ): Promise<{ amount: string; currency: string }> {
    const depositAmount = parseInt(booking.deposit_amount.amount, 10);
    const config = await this.getEffectiveConfig(offer);

    let penaltyAmount = 0;

    if (config?.no_show_keep_pct) {
      const percentagePenalty = Math.floor((depositAmount * config.no_show_keep_pct) / 100);
      penaltyAmount = percentagePenalty;
    }

    if (config?.no_show_cap) {
      const capAmount = parseInt(config.no_show_cap.amount, 10);
      penaltyAmount = Math.min(penaltyAmount, capAmount);
    } else {
      const defaultCap = 3000;
      penaltyAmount = Math.min(penaltyAmount, defaultCap);
    }

    const minPenalty = Math.min(penaltyAmount, Math.floor(depositAmount * 0.2));
    const finalPenalty = Math.max(minPenalty, 0);

    return {
      amount: finalPenalty.toString(),
      currency: booking.deposit_amount.currency || 'YER',
    };
  }

  async getEffectiveConfig(offer: OfferEntity): Promise<{
    release_days?: number;
    no_show_keep_pct?: number;
    no_show_cap?: { amount: string; currency: string };
  } | null> {
    if (offer.subcategory_id) {
      const config = await this.configRepository.findByScope(
        ConfigScope.SUBCATEGORY,
        offer.subcategory_id,
      );
      if (config) return this.configToPolicy(config);
    }

    if (offer.category_id) {
      const config = await this.configRepository.findByScope(
        ConfigScope.CATEGORY,
        offer.category_id,
      );
      if (config) return this.configToPolicy(config);
    }

    if (offer.region_code) {
      const config = await this.configRepository.findByScope(ConfigScope.REGION, offer.region_code);
      if (config) return this.configToPolicy(config);
    }

    const globalConfig = await this.configRepository.findByScope(ConfigScope.GLOBAL);
    if (globalConfig) return this.configToPolicy(globalConfig);

    return null;
  }

  private configToPolicy(config: {
    release_days?: number;
    no_show_keep_pct?: number;
    no_show_cap?: { amount: string; currency: string };
  }): {
    release_days?: number;
    no_show_keep_pct?: number;
    no_show_cap?: { amount: string; currency: string };
  } {
    return {
      ...(config.release_days !== undefined && { release_days: config.release_days }),
      ...(config.no_show_keep_pct !== undefined && { no_show_keep_pct: config.no_show_keep_pct }),
      ...(config.no_show_cap !== undefined && { no_show_cap: config.no_show_cap }),
    };
  }
}
