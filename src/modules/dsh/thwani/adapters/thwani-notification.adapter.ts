import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniRequestEntity, ThwaniRequestStatus } from '../entities/thwani-request.entity';
import { ThwaniChatMessageEntity } from '../entities/thwani-chat-message.entity';

/**
 * Thwani Notification Adapter
 *
 * Integrates with notification service for Thwani request events.
 */
@Injectable()
export class ThwaniNotificationAdapter {
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

  async notifyRequestCreated(request: ThwaniRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/request/created`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
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

  async notifyRequestAccepted(request: ThwaniRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/request/accepted`,
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

  async notifyRequestStatusChanged(
    request: ThwaniRequestEntity,
    oldStatus: ThwaniRequestStatus,
  ): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/request/status`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          old_status: oldStatus,
          new_status: request.status,
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

  async notifyCloseCodeGenerated(request: ThwaniRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/close-code/generated`,
        {
          request_id: request.id,
          requester_id: request.requester_id,
          captain_id: request.assigned_captain_id,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send close code generated notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id },
      );
    }
  }

  async notifyRequestClosed(request: ThwaniRequestEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/request/closed`,
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

  async notifyNewMessage(request: ThwaniRequestEntity, message: ThwaniChatMessageEntity): Promise<void> {
    try {
      await this.httpClient.post(
        `${this.notificationsApiUrl}/api/notifications/dsh/thwani/chat/message`,
        {
          request_id: request.id,
          message_id: message.id,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send new message notification',
        error instanceof Error ? error.stack : String(error),
        { requestId: request.id, messageId: message.id },
      );
    }
  }
}

