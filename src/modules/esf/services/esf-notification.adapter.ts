import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EsfNotificationAdapter {
  private readonly quietHoursStart: number;
  private readonly quietHoursEnd: number;
  private readonly dedupHours: number;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const quietHours = process.env.VAR_ESF_QUIET_HOURS || '22:00-08:00';
    const [start, end] = quietHours.split('-');
    this.quietHoursStart = this.parseTime(start);
    this.quietHoursEnd = this.parseTime(end);
    this.dedupHours = parseInt(process.env.VAR_ESF_DEDUP_HOURS || '24', 10);
  }

  async notifyDonorMatch(donorId: string, requestId: string): Promise<void> {
    if (!this.isQuietHours()) {
      await this.sendPushNotification(donorId, {
        type: 'esf_match',
        request_id: requestId,
        title: 'طلب تبرع بالدم جديد',
        body: 'تم العثور على طلب تبرع بالدم متوافق مع فصيلة دمك',
      });
    } else {
      this.logger.log('Quiet hours: skipping notification', { donorId, requestId });
    }
  }

  async notifyRequesterConfirmation(requesterId: string, requestId: string): Promise<void> {
    await this.sendPushNotification(requesterId, {
      type: 'esf_confirmation',
      request_id: requestId,
      title: 'تم تأكيد التبرع',
      body: 'تم قبول طلبك من قبل متبرع',
    });
  }

  async notifyNewMessage(
    recipientId: string,
    requestId: string,
    messageId: string,
    isUrgent: boolean,
  ): Promise<void> {
    if (isUrgent || !this.isQuietHours()) {
      await this.sendPushNotification(recipientId, {
        type: 'esf_message',
        request_id: requestId,
        message_id: messageId,
        title: isUrgent ? 'رسالة عاجلة' : 'رسالة جديدة',
        body: 'لديك رسالة جديدة في محادثة التبرع',
        urgent: isUrgent,
      });
    } else {
      this.logger.log('Quiet hours: skipping non-urgent notification', {
        recipientId,
        requestId,
        messageId,
      });
    }
  }

  private async sendPushNotification(
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const notificationsUrl = this.configService.get<string>('NOTIFICATIONS_SERVICE_URL');
    if (!notificationsUrl) {
      this.logger.warn('Notifications service URL not configured', { userId });
      return;
    }

    try {
      const response = await fetch(`${notificationsUrl}/notifications/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'esf',
        },
        body: JSON.stringify({
          user_id: userId,
          ...payload,
        }),
      });

      if (!response.ok) {
        this.logger.error('Failed to send notification', {
          userId,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      this.logger.error('Error sending notification', { error, userId });
    }
  }

  private isQuietHours(): boolean {
    const now = new Date();
    const tz = 'Asia/Aden';
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    if (this.quietHoursStart > this.quietHoursEnd) {
      return currentMinutes >= this.quietHoursStart || currentMinutes < this.quietHoursEnd;
    }
    return currentMinutes >= this.quietHoursStart && currentMinutes < this.quietHoursEnd;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }
}
