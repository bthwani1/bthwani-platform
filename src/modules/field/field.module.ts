import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { HttpModule } from '@nestjs/axios';
import { FieldAuthController } from './controllers/field-auth.controller';
import { FieldTasksController } from './controllers/field-tasks.controller';
import { FieldPartnersController } from './controllers/field-partners.controller';
import { FieldMediaController } from './controllers/field-media.controller';
import { FieldAuthService } from './services/field-auth.service';
import { FieldTasksService } from './services/field-tasks.service';
import { FieldPartnersService } from './services/field-partners.service';
import { FieldMediaService } from './services/field-media.service';
import { FieldIdentityAdapter } from './adapters/field-identity.adapter';
import { FieldTaskEngineAdapter } from './adapters/field-task-engine.adapter';
import { FieldPartnerOnboardingAdapter } from './adapters/field-partner-onboarding.adapter';
import { FieldMediaStoreAdapter } from './adapters/field-media-store.adapter';
import { FieldNotificationsAdapter } from './adapters/field-notifications.adapter';
import { FieldMetricsCollector } from './services/field-metrics-collector.service';
import { FieldAuditLogger } from './services/field-audit-logger.service';

/**
 * Field Module (APP-FIELD BFF)
 *
 * Backend-for-frontend for the field mobile app.
 * Sole purpose: partner acquisition and onboarding only.
 *
 * Responsibilities:
 * - Auth proxy and session handling
 * - Task orchestration with SLA checks
 * - Partner lead/record CRUD via /partner/*
 * - Media pre-sign and upload relay
 * - Validation of forms and required fields
 *
 * Application Code: APP-FIELD
 * Scope: Partner acquisition → verification → onboarding → go-live readiness
 */
@Module({
  imports: [MikroOrmModule.forFeature([]), HttpModule],
  controllers: [
    FieldAuthController,
    FieldTasksController,
    FieldPartnersController,
    FieldMediaController,
  ],
  providers: [
    // Services
    FieldAuthService,
    FieldTasksService,
    FieldPartnersService,
    FieldMediaService,
    FieldMetricsCollector,
    FieldAuditLogger,
    // Adapters
    FieldIdentityAdapter,
    FieldTaskEngineAdapter,
    FieldPartnerOnboardingAdapter,
    FieldMediaStoreAdapter,
    FieldNotificationsAdapter,
  ],
  exports: [FieldTasksService, FieldPartnersService, FieldMetricsCollector],
})
export class FieldModule {}

