import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import {
  SndRequestEntity,
  SndCategoryEntity,
  SndPricingProfileEntity,
  SndChatMessageEntity,
  SndProofCloseEntity,
  SndConfigEntity,
  SndAuditLogEntity,
} from './entities';

import {
  SndRequestRepository,
  SndCategoryRepository,
  SndPricingProfileRepository,
  SndChatMessageRepository,
  SndProofCloseRepository,
  SndConfigRepository,
  SndAuditLogRepository,
} from './repositories';

import {
  SndRequestCommandService,
  SndRequestQueryService,
  PricingEngineService,
  RoutingEngineService,
  SndChatService,
  SndProofCloseService,
  SndAuditLogger,
  SndMetricsCollectorService,
} from './services';

import { SndWalletAdapter, SndNotificationAdapter, SndIdentityAdapter } from './adapters';

import {
  SndUserController,
  SndCaptainController,
  SndAdminController,
  SndSupportController,
} from './controllers';

/**
 * SND Module (سند)
 *
 * Service for instant help requests and specialized services:
 * - Request creation (instant|specialized)
 * - Pricing engine (instant only)
 * - Routing engine (captain/specialized/manual)
 * - Chat service with phone masking
 * - Proof-of-close with 6-digit code
 * - Wallet integration (ledger entries only, no bank payouts)
 * - Admin/Support dashboards
 * - Audit logging
 *
 * Service Code: SRV-SND-01
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      SndRequestEntity,
      SndCategoryEntity,
      SndPricingProfileEntity,
      SndChatMessageEntity,
      SndProofCloseEntity,
      SndConfigEntity,
      SndAuditLogEntity,
    ]),
  ],
  controllers: [SndUserController, SndCaptainController, SndAdminController, SndSupportController],
  providers: [
    // Repositories
    SndRequestRepository,
    SndCategoryRepository,
    SndPricingProfileRepository,
    SndChatMessageRepository,
    SndProofCloseRepository,
    SndConfigRepository,
    SndAuditLogRepository,
    // Services
    SndRequestCommandService,
    SndRequestQueryService,
    PricingEngineService,
    RoutingEngineService,
    SndChatService,
    SndProofCloseService,
    SndAuditLogger,
    SndMetricsCollectorService,
    // Adapters
    SndWalletAdapter,
    SndNotificationAdapter,
    SndIdentityAdapter,
  ],
  exports: [SndRequestQueryService, SndMetricsCollectorService],
})
export class SndModule {}
