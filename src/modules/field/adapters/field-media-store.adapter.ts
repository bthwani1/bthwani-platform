import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Field Media Store Adapter
 *
 * Adapter for Media Store service.
 */
@Injectable()
export class FieldMediaStoreAdapter {
  private readonly mediaStoreBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.mediaStoreBaseUrl =
      this.configService.get<string>('MEDIA_STORE_SERVICE_URL') ||
      'http://localhost:3004';
  }

  async generatePresignedUrl(data: {
    partner_id: string;
    file_type: string;
    file_name: string;
    content_type: string;
    uploaded_by: string;
  }): Promise<{
    media_id: string;
    presigned_url: string;
    expires_in: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.mediaStoreBaseUrl}/media/presigned-url`,
          data,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Media store adapter: Generate presigned URL failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId: data.partner_id,
      });
      throw error;
    }
  }

  async verifyUpload(mediaId: string, agentId: string): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.mediaStoreBaseUrl}/media/${mediaId}/verify`, {
          verified_by: agentId,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Media store adapter: Verify upload failed', error instanceof Error ? error.message : 'Unknown error', {
        mediaId,
        agentId,
      });
      throw error;
    }
  }

  async listPartnerMedia(
    partnerId: string,
    agentId: string,
    type?: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.mediaStoreBaseUrl}/media/partners/${partnerId}`,
          {
            params: {
              agent_id: agentId,
              ...(type && { type }),
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Media store adapter: List partner media failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }
}

