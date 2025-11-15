import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EsfRequestEntity } from './entities/esf-request.entity';
import { EsfDonorProfileEntity } from './entities/esf-donor-profile.entity';
import { EsfChatMessageEntity } from './entities/esf-chat-message.entity';
import { EsfMatchEntity } from './entities/esf-match.entity';
import { EsfConfigEntity } from './entities/esf-config.entity';
import { EsfAuditLogEntity } from './entities/esf-audit-log.entity';
import { EsfRequestRepository } from './repositories/esf-request.repository';
import { EsfDonorProfileRepository } from './repositories/esf-donor-profile.repository';
import { EsfChatMessageRepository } from './repositories/esf-chat-message.repository';
import { EsfMatchRepository } from './repositories/esf-match.repository';
import { EsfConfigRepository } from './repositories/esf-config.repository';
import { EsfAuditLogRepository } from './repositories/esf-audit-log.repository';
import { EsfRequestService } from './services/esf-request.service';
import { EsfDonorProfileService } from './services/esf-donor-profile.service';
import { EsfMatchingService } from './services/esf-matching.service';
import { EsfChatService } from './services/esf-chat.service';
import { EsfNotificationAdapter } from './services/esf-notification.adapter';
import { EsfIdentityAdapter } from './services/esf-identity.adapter';
import { EsfMetricsCollector } from './services/esf-metrics-collector.service';
import { EsfAuditLogger } from './services/esf-audit-logger.service';
import { EsfUserController } from './controllers/esf-user.controller';
import { EsfAdminController } from './controllers/esf-admin.controller';
import { EsfSupportController } from './controllers/esf-support.controller';
import { EsfHealthController } from './controllers/esf-health.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      EsfRequestEntity,
      EsfDonorProfileEntity,
      EsfChatMessageEntity,
      EsfMatchEntity,
      EsfConfigEntity,
      EsfAuditLogEntity,
    ]),
  ],
  controllers: [EsfUserController, EsfAdminController, EsfSupportController, EsfHealthController],
  providers: [
    EsfRequestRepository,
    EsfDonorProfileRepository,
    EsfChatMessageRepository,
    EsfMatchRepository,
    EsfConfigRepository,
    EsfAuditLogRepository,
    EsfRequestService,
    EsfDonorProfileService,
    EsfMatchingService,
    EsfChatService,
    EsfNotificationAdapter,
    EsfIdentityAdapter,
    EsfMetricsCollector,
    EsfAuditLogger,
  ],
  exports: [
    EsfRequestService,
    EsfDonorProfileService,
    EsfMatchingService,
    EsfChatService,
    EsfMetricsCollector,
  ],
})
export class EsfModule {}
