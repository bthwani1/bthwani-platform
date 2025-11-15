import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OfferEntity } from './entities/offer.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingChatMessageEntity } from './entities/booking-chat-message.entity';
import { BookingAmendmentEntity } from './entities/booking-amendment.entity';
import { ArbConfigEntity } from './entities/arb-config.entity';
import { ArbAuditLogEntity } from './entities/arb-audit-log.entity';
import { OfferRepository } from './repositories/offer.repository';
import { BookingRepository } from './repositories/booking.repository';
import { BookingChatMessageRepository } from './repositories/booking-chat-message.repository';
import { BookingAmendmentRepository } from './repositories/booking-amendment.repository';
import { ArbConfigRepository } from './repositories/arb-config.repository';
import { ArbAuditLogRepository } from './repositories/arb-audit-log.repository';
import { OfferService } from './services/offer.service';
import { BookingCommandService } from './services/booking-command.service';
import { BookingQueryService } from './services/booking-query.service';
import { EscrowEngineService } from './services/escrow-engine.service';
import { ArbChatService } from './services/chat.service';
import { ArbMetricsCollectorService } from './services/metrics-collector.service';
import { ArbAuditLogger } from './services/audit-logger.service';
import { ArbWalletAdapter } from './adapters/wallet.adapter';
import { ArbIdentityAdapter } from './adapters/identity.adapter';
import { ArbNotificationAdapter } from './adapters/notification.adapter';
import { ArbOffersController } from './controllers/arb-offers.controller';
import {
  ArbBookingsController,
  ArbPartnerBookingsController,
} from './controllers/arb-bookings.controller';
import { ArbChatController, ArbChatAuditController } from './controllers/arb-chat.controller';
import { ArbAdminController } from './controllers/arb-admin.controller';
import { ArbSupportController } from './controllers/arb-support.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      OfferEntity,
      BookingEntity,
      BookingChatMessageEntity,
      BookingAmendmentEntity,
      ArbConfigEntity,
      ArbAuditLogEntity,
    ]),
  ],
  controllers: [
    ArbOffersController,
    ArbBookingsController,
    ArbPartnerBookingsController,
    ArbChatController,
    ArbChatAuditController,
    ArbAdminController,
    ArbSupportController,
  ],
  providers: [
    OfferRepository,
    BookingRepository,
    BookingChatMessageRepository,
    BookingAmendmentRepository,
    ArbConfigRepository,
    ArbAuditLogRepository,
    OfferService,
    BookingCommandService,
    BookingQueryService,
    EscrowEngineService,
    ArbChatService,
    ArbMetricsCollectorService,
    ArbAuditLogger,
    ArbWalletAdapter,
    ArbIdentityAdapter,
    ArbNotificationAdapter,
  ],
  exports: [
    OfferService,
    BookingCommandService,
    BookingQueryService,
    EscrowEngineService,
    ArbChatService,
    ArbMetricsCollectorService,
  ],
})
export class ArbModule {}
