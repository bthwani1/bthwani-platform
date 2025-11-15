import { Injectable } from '@nestjs/common';
import { FieldMediaStoreAdapter } from '../adapters/field-media-store.adapter';
import { LoggerService } from '../../../core/services/logger.service';
import { FieldAuditLogger } from './field-audit-logger.service';

/**
 * Field Media Service
 *
 * Handles media operations for field agents.
 */
@Injectable()
export class FieldMediaService {
  constructor(
    private readonly mediaStoreAdapter: FieldMediaStoreAdapter,
    private readonly auditLogger: FieldAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async generatePresignedUrl(
    agentId: string,
    partnerId: string,
    fileType: string,
    fileName: string,
    contentType: string,
  ): Promise<unknown> {
    this.logger.log('Presigned URL generation', {
      agentId,
      partnerId,
      fileType,
      fileName,
    });

    const result = await this.mediaStoreAdapter.generatePresignedUrl({
      partner_id: partnerId,
      file_type: fileType,
      file_name: fileName,
      content_type: contentType,
      uploaded_by: agentId,
    });

    await this.auditLogger.log({
      entityType: 'media',
      entityId: result.media_id,
      action: 'generate_presigned_url',
      userId: agentId,
      metadata: {
        partner_id: partnerId,
        file_type: fileType,
      },
    });

    return result;
  }

  async verifyUpload(mediaId: string, agentId: string): Promise<unknown> {
    this.logger.log('Upload verification', { mediaId, agentId });

    const result = await this.mediaStoreAdapter.verifyUpload(mediaId, agentId);

    await this.auditLogger.log({
      entityType: 'media',
      entityId: mediaId,
      action: 'verify_upload',
      userId: agentId,
    });

    return result;
  }

  async listPartnerMedia(
    partnerId: string,
    agentId: string,
    type?: string,
  ): Promise<unknown> {
    return this.mediaStoreAdapter.listPartnerMedia(partnerId, agentId, type);
  }
}

