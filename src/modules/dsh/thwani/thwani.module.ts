import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  ThwaniRequestEntity,
  ThwaniPricingProfileEntity,
  ThwaniProofCloseEntity,
  ThwaniChatMessageEntity,
} from './entities';
import {
  ThwaniRequestRepository,
  ThwaniPricingProfileRepository,
  ThwaniProofCloseRepository,
  ThwaniChatMessageRepository,
} from './repositories';
import {
  ThwaniPricingEngineService,
  ThwaniRoutingEngineService,
  ThwaniProofCloseService,
  ThwaniChatService,
  ThwaniRequestCommandService,
  ThwaniRequestQueryService,
} from './services';
import { ThwaniWalletAdapter, ThwaniNotificationAdapter } from './adapters';
import { ThwaniUserController, ThwaniCaptainController } from './controllers';

/**
 * Thwani Module (ثواني)
 *
 * Submodule of DSH for instant help requests.
 * Migrated from SND with DSH infrastructure reuse.
 *
 * Service Code: SRV-DSH-02 (Thwani submodule)
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ThwaniRequestEntity,
      ThwaniPricingProfileEntity,
      ThwaniProofCloseEntity,
      ThwaniChatMessageEntity,
    ]),
  ],
  controllers: [ThwaniUserController, ThwaniCaptainController],
  providers: [
    // Repositories
    ThwaniRequestRepository,
    ThwaniPricingProfileRepository,
    ThwaniProofCloseRepository,
    ThwaniChatMessageRepository,
    // Services
    ThwaniPricingEngineService,
    ThwaniRoutingEngineService,
    ThwaniProofCloseService,
    ThwaniChatService,
    ThwaniRequestCommandService,
    ThwaniRequestQueryService,
    // Adapters
    ThwaniWalletAdapter,
    ThwaniNotificationAdapter,
  ],
  exports: [ThwaniRequestQueryService],
})
export class ThwaniModule {}

