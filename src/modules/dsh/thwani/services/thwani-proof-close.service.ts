import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ThwaniProofCloseRepository } from '../repositories/thwani-proof-close.repository';
import { ThwaniRequestRepository } from '../repositories/thwani-request.repository';
import { ThwaniProofCloseEntity } from '../entities/thwani-proof-close.entity';
import { ThwaniRequestEntity, ThwaniRequestStatus } from '../entities/thwani-request.entity';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniWalletAdapter } from '../adapters/thwani-wallet.adapter';
import { ThwaniNotificationAdapter } from '../adapters/thwani-notification.adapter';

export interface CloseRequestDto {
  close_code: string;
  recipient_name: string;
}

/**
 * Thwani Proof of Close Service
 *
 * Manages 6-digit close codes for instant help request completion.
 * Reuses DSH proof-of-delivery pattern.
 */
@Injectable()
export class ThwaniProofCloseService {
  constructor(
    private readonly proofCloseRepository: ThwaniProofCloseRepository,
    private readonly requestRepository: ThwaniRequestRepository,
    private readonly walletAdapter: ThwaniWalletAdapter,
    private readonly notificationAdapter: ThwaniNotificationAdapter,
    private readonly logger: LoggerService,
  ) {}

  async generateCloseCode(requestId: string, captainId: string): Promise<string> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (request.assigned_captain_id !== captainId) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'Only assigned captain can generate close code',
      });
    }

    let existing = await this.proofCloseRepository.findByRequestId(requestId);
    if (existing && existing.is_verified) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/already_closed',
        title: 'Already Closed',
        status: 400,
        code: 'THWANI-400-ALREADY-CLOSED',
        detail: 'Request is already closed',
      });
    }

    if (!existing) {
      existing = new ThwaniProofCloseEntity();
      existing.request_id = requestId;
      existing.verified_by_id = captainId;
    }

    const closeCode = this.generateSixDigitCode();
    existing.close_code = closeCode;

    const saved = await this.proofCloseRepository.create(existing);

    await this.notificationAdapter.notifyCloseCodeGenerated(request);

    return closeCode;
  }

  async verifyCloseCode(
    requestId: string,
    userId: string,
    closeDto: CloseRequestDto,
    idempotencyKey: string,
  ): Promise<ThwaniRequestEntity> {
    const existing = await this.proofCloseRepository.findByIdempotencyKey(idempotencyKey);
    if (existing && existing.is_verified) {
      const request = await this.requestRepository.findOne(requestId);
      if (!request) {
        throw new NotFoundException({
          type: 'https://errors.bthwani.com/thwani/request_not_found',
          title: 'Request Not Found',
          status: 404,
          code: 'THWANI-404-REQUEST-NOT-FOUND',
        });
      }
      return request;
    }

    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'Only requester or captain can verify close code',
      });
    }

    let proofClose = await this.proofCloseRepository.findByRequestId(requestId);
    if (!proofClose) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/no_close_code',
        title: 'No Close Code',
        status: 400,
        code: 'THWANI-400-NO-CLOSE-CODE',
        detail: 'No close code generated for this request',
      });
    }

    if (proofClose.close_code !== closeDto.close_code) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/invalid_close_code',
        title: 'Invalid Close Code',
        status: 400,
        code: 'THWANI-400-INVALID-CLOSE-CODE',
        detail: 'Invalid close code',
      });
    }

    if (proofClose.is_verified) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/already_closed',
        title: 'Already Closed',
        status: 400,
        code: 'THWANI-400-ALREADY-CLOSED',
        detail: 'Request is already closed',
      });
    }

    proofClose.is_verified = true;
    proofClose.verified_at = new Date();
    proofClose.recipient_name = closeDto.recipient_name;
    proofClose.idempotency_key = idempotencyKey;

    await this.proofCloseRepository.update(proofClose);

    request.status = ThwaniRequestStatus.CLOSED;
    request.close_code = closeDto.close_code;
    request.close_recipient_name = closeDto.recipient_name;
    request.closed_at = new Date();

    if (request.price_final_yer && request.price_final_yer > 0) {
      try {
        await this.walletAdapter.createLedgerEntry(
          request,
          request.price_final_yer,
          idempotencyKey,
        );
      } catch (error) {
        this.logger.error(
          'Failed to create ledger entry',
          error instanceof Error ? error.stack : String(error),
          {
            requestId: request.id,
          },
        );
      }
    }

    const updated = await this.requestRepository.update(request);

    await this.notificationAdapter.notifyRequestClosed(request);

    return updated;
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

