import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { SndRequestEntity } from '../entities/request.entity';

@Injectable()
export class SndNotificationAdapter {
  private readonly notificationsApiUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.notificationsApiUrl = this.configService.get<string>(
      'NOTIFICATIONS_API_URL',
      'http://localhost:3002',
    );
    this.httpClient = axios.create({
      baseURL: this.notificationsApiUrl,
      timeout: 30000,
    });
  }

  async notifyRequestCreated(request: SndRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/snd/request/created`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          type: request.type,
          status: request.status,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send request created notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }

  async notifyRequestAccepted(request: SndRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/snd/request/accepted`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          captain_id: request.assigned_captain_id,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send request accepted notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }

  async notifyStatusChange(
    request: SndRequestEntity,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/snd/request/status`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          old_status: oldStatus,
          new_status: newStatus,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send status change notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }

  async notifyNewMessage(
    recipientId: string,
    requestId: string,
    messageId: string,
    isUrgent: boolean,
  ): Promise<void> {
    try {
      await this.httpClient.post(`${this.notificationsApiUrl}/api/notifications/snd/message/new`, {
        recipient_id: recipientId,
        request_id: requestId,
        message_id: messageId,
        is_urgent: isUrgent,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send new message notification',
        error instanceof Error ? error.stack : String(error),
        { requestId, messageId },
      );
    }
  }

  async notifyCloseCodeGenerated(request: SndRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(`${this.notificationsApiUrl}/api/notifications/snd/close/code`, {
        request_id: request.id,
        requester_id: request.requester_id,
        captain_id: request.assigned_captain_id,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send close code notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }

  async notifyRequestClosed(request: SndRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/snd/request/closed`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          captain_id: request.assigned_captain_id,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send request closed notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }
}
