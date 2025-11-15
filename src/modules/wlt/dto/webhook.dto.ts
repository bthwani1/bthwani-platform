import { IsString, IsEnum, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum WebhookEvent {
  REFUND_SUCCEEDED = 'refund.succeeded',
  REFUND_FAILED = 'refund.failed',
  CHARGEBACK_OPENED = 'chargeback.opened',
  CHARGEBACK_CLOSED = 'chargeback.closed',
}

export class ProviderWebhookDto {
  @ApiProperty({ description: 'Webhook event type', enum: WebhookEvent })
  @IsEnum(WebhookEvent)
  event!: WebhookEvent;

  @ApiProperty({ description: 'HMAC signature' })
  @IsString()
  signature!: string;

  @ApiProperty({ description: 'Event timestamp (ISO 8601)' })
  @IsDateString()
  issued_at!: string;

  @ApiProperty({ description: 'Event data payload' })
  @IsObject()
  data!: Record<string, unknown>;
}
