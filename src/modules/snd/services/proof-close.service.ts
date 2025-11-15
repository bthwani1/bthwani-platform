import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SndProofCloseRepository } from '../repositories/proof-close.repository';
import { SndRequestRepository } from '../repositories/request.repository';
import { SndProofCloseEntity } from '../entities/proof-close.entity';
import { SndRequestEntity, SndRequestType, SndRequestStatus } from '../entities/request.entity';
import { CloseRequestDto } from '../dto/requests/close-request.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { SndWalletAdapter } from '../adapters/wallet.adapter';
import { SndNotificationAdapter } from '../adapters/notification.adapter';
import { SndAuditLogger } from './audit-logger.service';

@Injectable()
export class SndProofCloseService {
  constructor(
    private readonly proofCloseRepository: SndProofCloseRepository,
    private readonly requestRepository: SndRequestRepository,
    private readonly walletAdapter: SndWalletAdapter,
    private readonly notificationAdapter: SndNotificationAdapter,
    private readonly auditLogger: SndAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async generateCloseCode(requestId: string, captainId: string): Promise<string> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    if (request.type !== SndRequestType.INSTANT) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/invalid_request_type',
        title: 'Invalid Request Type',
        status: 400,
        code: 'SND-400-INVALID-REQUEST-TYPE',
        detail: 'Close codes are only for instant requests',
      });
    }

    if (request.assigned_captain_id !== captainId) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'Only assigned captain can generate close code',
      });
    }

    let existing = await this.proofCloseRepository.findByRequestId(requestId);
    if (existing && existing.is_verified) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/already_closed',
        title: 'Already Closed',
        status: 400,
        code: 'SND-400-ALREADY-CLOSED',
        detail: 'Request is already closed',
      });
    }

    if (!existing) {
      existing = new SndProofCloseEntity();
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
  ): Promise<SndRequestEntity> {
    const existing = await this.proofCloseRepository.findByIdempotencyKey(idempotencyKey);
    if (existing && existing.is_verified) {
      const request = await this.requestRepository.findOne(requestId);
      if (!request) {
        throw new NotFoundException({
          type: 'https://errors.bthwani.com/snd/request_not_found',
          title: 'Request Not Found',
          status: 404,
          code: 'SND-404-REQUEST-NOT-FOUND',
        });
      }
      return request;
    }

    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new ForbiddenException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'Only requester or captain can verify close code',
      });
    }

    if (request.type !== SndRequestType.INSTANT) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/invalid_request_type',
        title: 'Invalid Request Type',
        status: 400,
        code: 'SND-400-INVALID-REQUEST-TYPE',
        detail: 'Close codes are only for instant requests',
      });
    }

    let proofClose = await this.proofCloseRepository.findByRequestId(requestId);
    if (!proofClose) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/no_close_code',
        title: 'No Close Code',
        status: 400,
        code: 'SND-400-NO-CLOSE-CODE',
        detail: 'No close code generated for this request',
      });
    }

    if (proofClose.close_code !== closeDto.close_code) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/invalid_close_code',
        title: 'Invalid Close Code',
        status: 400,
        code: 'SND-400-INVALID-CLOSE-CODE',
        detail: 'Invalid close code',
      });
    }

    if (proofClose.is_verified) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/already_closed',
        title: 'Already Closed',
        status: 400,
        code: 'SND-400-ALREADY-CLOSED',
        detail: 'Request is already closed',
      });
    }

    proofClose.is_verified = true;
    proofClose.verified_at = new Date();
    proofClose.recipient_name = closeDto.recipient_name;
    proofClose.idempotency_key = idempotencyKey;

    await this.proofCloseRepository.update(proofClose);

    request.status = SndRequestStatus.CLOSED;
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

    await this.auditLogger.log({
      entityType: 'request',
      entityId: requestId,
      action: 'close',
      userId,
      newValues: {
        status: SndRequestStatus.CLOSED,
        close_code: closeDto.close_code,
        recipient_name: closeDto.recipient_name,
      },
    });

    return updated;
  }

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
