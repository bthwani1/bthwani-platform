import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import {
  ListingEntity,
  ReportEntity,
  SkillCatalogEntity,
  RankingConfigEntity,
  ModerationLogEntity,
  AuditLogEntity,
} from './entities';

// Repositories
import {
  ListingRepository,
  ReportRepository,
  SkillCatalogRepository,
  RankingConfigRepository,
  ModerationLogRepository,
  AuditLogRepository,
} from './repositories';

// Services
import {
  ListingCommandService,
  ListingQueryService,
  RankingEngineService,
  ModerationService,
  ReportService,
  CatalogService,
} from './services';

// Adapters
import { SearchIndexAdapter, AnalyticsAdapter, AuditLoggerAdapter } from './adapters';

// Controllers
import { KwdPublicController, KwdAdminController, KwdSupportController } from './controllers';

/**
 * KWD Module (KoWADER Jobs Service)
 *
 * Free job board platform with:
 * - Public CRUD for listings (via APP-USER)
 * - Public read-only search (web)
 * - Admin review and approval workflow
 * - Support moderation and abuse reporting
 * - Skills catalog management
 * - Configurable ranking (Sponsored > Freshness > Proximity > TextScore)
 *
 * Service Code: SRV-KWD-01
 * Retention: Posts 180d, Logs/Reports 365d
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ListingEntity,
      ReportEntity,
      SkillCatalogEntity,
      RankingConfigEntity,
      ModerationLogEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [KwdPublicController, KwdAdminController, KwdSupportController],
  providers: [
    // Repositories
    ListingRepository,
    ReportRepository,
    SkillCatalogRepository,
    RankingConfigRepository,
    ModerationLogRepository,
    AuditLogRepository,
    // Services
    ListingCommandService,
    ListingQueryService,
    RankingEngineService,
    ModerationService,
    ReportService,
    CatalogService,
    // Adapters
    SearchIndexAdapter,
    AnalyticsAdapter,
    AuditLoggerAdapter,
  ],
  exports: [
    // Export services for potential cross-module use
    ListingQueryService,
    ReportService,
    CatalogService,
  ],
})
export class KwdModule {}
