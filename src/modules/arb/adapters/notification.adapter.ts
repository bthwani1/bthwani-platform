import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArbNotificationAdapter {
  private readonly quietHoursStart: number;
  private readonly quietHoursEnd: number;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const quietHours = process.env.VAR_ARB_QUIET_HOURS || '22:00-08:00';
    const [start, end] = quietHours.split('-');
    this.quietHoursStart = this.parseTime(start || '22:00');
    this.quietHoursEnd = this.parseTime(end || '08:00');
  }

  async notifyBookingCreated(
    customerId: string,
    partnerId: string,
    bookingId: string,
  ): Promise<void> {
    await this.sendPushNotification(customerId, {
      type: 'arb_booking_created',
      booking_id: bookingId,
      title: 'تم إنشاء الحجز',
      body: 'تم إنشاء حجزك بنجاح. سيتم حجز العربون مؤقتاً.',
    });

    await this.sendPushNotification(partnerId, {
      type: 'arb_booking_received',
      booking_id: bookingId,
      title: 'حجز جديد',
      body: 'لديك حجز جديد يتطلب التأكيد',
    });
  }

  async notifyBookingConfirmed(customerId: string, bookingId: string): Promise<void> {
    await this.sendPushNotification(customerId, {
      type: 'arb_booking_confirmed',
      booking_id: bookingId,
      title: 'تم تأكيد الحجز',
      body: 'تم تأكيد حجزك من قبل الشريك',
    });
  }

  async notifyBookingStatusChange(
    customerId: string,
    partnerId: string,
    bookingId: string,
    status: string,
  ): Promise<void> {
    const statusMessages: Record<string, { title: string; body: string }> = {
      attended: { title: 'تم الحضور', body: 'تم تسجيل حضورك بنجاح' },
      no_show: { title: 'عدم الحضور', body: 'لم يتم تسجيل حضورك' },
      cancelled: { title: 'تم الإلغاء', body: 'تم إلغاء الحجز' },
      completed: { title: 'اكتمل الحجز', body: 'تم إكمال الحجز بنجاح' },
    };

    const message = statusMessages[status];
    if (message) {
      await this.sendPushNotification(customerId, {
        type: 'arb_booking_status',
        booking_id: bookingId,
        status,
        ...message,
      });

      await this.sendPushNotification(partnerId, {
        type: 'arb_booking_status',
        booking_id: bookingId,
        status,
        ...message,
      });
    }
  }

  async notifyNewMessage(
    recipientId: string,
    bookingId: string,
    messageId: string,
    isUrgent: boolean,
  ): Promise<void> {
    if (isUrgent || !this.isQuietHours()) {
      await this.sendPushNotification(recipientId, {
        type: 'arb_message',
        booking_id: bookingId,
        message_id: messageId,
        title: isUrgent ? 'رسالة عاجلة' : 'رسالة جديدة',
        body: 'لديك رسالة جديدة في محادثة الحجز',
        urgent: isUrgent,
      });
    } else {
      this.logger.log('Quiet hours: skipping non-urgent notification', {
        recipientId,
        bookingId,
        messageId,
      });
    }
  }

  async notifyEscrowReleased(customerId: string, bookingId: string, amount: string): Promise<void> {
    await this.sendPushNotification(customerId, {
      type: 'arb_escrow_released',
      booking_id: bookingId,
      title: 'تم إفراج العربون',
      body: `تم إفراج العربون بمبلغ ${amount} YER`,
    });
  }

  async notifyEscrowRefunded(customerId: string, bookingId: string, amount: string): Promise<void> {
    await this.sendPushNotification(customerId, {
      type: 'arb_escrow_refunded',
      booking_id: bookingId,
      title: 'تم استرداد العربون',
      body: `تم استرداد العربون بمبلغ ${amount} YER`,
    });
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
          'X-Service-Name': 'arb',
        },
        body: JSON.stringify({
          user_id: userId,
          ...payload,
        }),
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to send notification: ${response.status} ${response.statusText} (userId: ${userId})`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error} (userId: ${userId})`);
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

  private parseTime(timeStr: string | undefined): number {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }
}
