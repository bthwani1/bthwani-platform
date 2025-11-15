import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { SubmitPodCodeDto, SubmitPodPhotoDto } from '../dto/pod/pod.dto';
import { DshCaptainsService } from '../../dsh/services/dsh-captains.service';

@Injectable()
export class CaptainPodService {
  constructor(
    private readonly logger: LoggerService,
    private readonly dshCaptainsService: DshCaptainsService,
  ) {}

  async submitPodCode(
    captainId: string,
    jobId: string,
    submitDto: SubmitPodCodeDto,
    idempotencyKey: string,
  ): Promise<{ success: boolean; verified: boolean }> {
    this.logger.log('Submit PoD code', {
      captainId,
      jobId,
      code: submitDto.code.substring(0, 2) + '****', // Log masked
      idempotencyKey,
    });

    // TODO: Check idempotency
    // TODO: Verify job belongs to captain
    const order = await this.dshCaptainsService.getOrder(captainId, jobId);

    // TODO: Verify code with DSH service
    // TODO: Check code format and validity
    const isValid = submitDto.code.length === 6 && /^\d+$/.test(submitDto.code);

    if (!isValid) {
      throw new UnprocessableEntityException({
        type: 'https://errors.bthwani.com/captain/invalid_pod_code',
        title: 'Invalid PoD Code',
        status: 422,
        code: 'CAP-POD-INVALID',
        detail: 'كود التسليم غير صحيح',
      });
    }

    // TODO: Verify code matches order
    // TODO: Mark order as delivered with code verification
    await this.dshCaptainsService.deliverOrder(captainId, jobId, {});

    return {
      success: true,
      verified: true,
    };
  }

  async submitPodPhoto(
    captainId: string,
    jobId: string,
    submitDto: SubmitPodPhotoDto,
    idempotencyKey: string,
  ): Promise<{ success: boolean; photo_id: string }> {
    this.logger.log('Submit PoD photo', {
      captainId,
      jobId,
      idempotencyKey,
      hasPhoto: !!submitDto.photo,
    });

    // TODO: Check idempotency
    // TODO: Verify job belongs to captain
    const order = await this.dshCaptainsService.getOrder(captainId, jobId);

    // TODO: Validate photo format (base64, image type)
    // TODO: Apply masking (faces, numbers) - should be done client-side per policy
    // TODO: Upload to storage with retention policy (VAR_POD_RETENTION_DAYS)
    // TODO: Store photo metadata in database
    const photoId = `photo_${Date.now()}_${jobId}`;

    // TODO: Mark order as delivered with photo
    await this.dshCaptainsService.deliverOrder(captainId, jobId, {
      photo: submitDto.photo,
    });

    return {
      success: true,
      photo_id: photoId,
    };
  }
}

