import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Field Notifications Adapter
 *
 * Adapter for Notifications Hub service.
 */
@Injectable()
export class FieldNotificationsAdapter {
  private readonly notificationsBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.notificationsBaseUrl =
      this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') ||
      'http://localhost:3005';
  }

  async sendTaskNotification(
    agentId: string,
    taskId: string,
    type: 'new' | 'updated' | 'overdue',
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.notificationsBaseUrl}/notifications/push`,
          {
            recipient_id: agentId,
            channel: 'field_app',
            type: `task_${type}`,
            data: {
              task_id: taskId,
              ...data,
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error('Notifications adapter: Send task notification failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
        taskId,
      });
    }
  }

  async sendSlaAlert(agentId: string, taskId: string, slaInfo: Record<string, unknown>): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.notificationsBaseUrl}/notifications/push`,
          {
            recipient_id: agentId,
            channel: 'field_app',
            type: 'sla_alert',
            data: {
              task_id: taskId,
              ...slaInfo,
            },
          },
        ),
      );
    } catch (error) {
      this.logger.error('Notifications adapter: Send SLA alert failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
        taskId,
      });
    }
  }
}

