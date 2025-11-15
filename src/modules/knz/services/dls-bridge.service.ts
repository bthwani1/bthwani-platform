import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { DispatchDlsDto } from '../dto/bridge/dispatch-dls.dto';

export interface DlsDeliveryJobResponse {
  dls_order_id: string;
  status: string;
  created_at: Date;
}

@Injectable()
export class DlsBridgeService {
  private readonly dshApiUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.dshApiUrl = this.configService.get<string>('DSH_API_URL', 'http://localhost:3002');
    this.httpClient = axios.create({
      baseURL: this.dshApiUrl,
      timeout: 30000,
    });
  }

  async createDeliveryJob(
    dto: DispatchDlsDto,
    idempotencyKey?: string,
  ): Promise<{ dls_order_id: string }> {
    this.logger.log('Creating DLS delivery job', {
      knzOrderId: dto.knz_order_id,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const payload = {
        knz_order_id: dto.knz_order_id,
        shipping_address: dto.shipping_address,
        delivery_notes: dto.delivery_notes,
      };

      const response = await this.httpClient.post<DlsDeliveryJobResponse>(
        `${this.dshApiUrl}/api/dls/knz/delivery-jobs`,
        payload,
        { headers },
      );

      return {
        dls_order_id: response.data.dls_order_id,
      };
    } catch (error) {
      this.logger.error(
        'Failed to create DLS delivery job',
        error instanceof Error ? error.stack : String(error),
        {
          knzOrderId: dto.knz_order_id,
        },
      );
      throw error;
    }
  }

  async getDeliveryJobStatus(dlsOrderId: string): Promise<unknown> {
    try {
      const response = await this.httpClient.get(
        `${this.dshApiUrl}/api/dls/knz/delivery-jobs/${dlsOrderId}/status`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get delivery job status',
        error instanceof Error ? error.stack : String(error),
        {
          dlsOrderId,
        },
      );
      throw error;
    }
  }
}
