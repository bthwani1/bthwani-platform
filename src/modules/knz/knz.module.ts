import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategoryEntity } from './entities/category.entity';
import { FeeProfileEntity } from './entities/fee-profile.entity';
import { ListingEntity } from './entities/listing.entity';
import { KnzOrderEntity } from './entities/knz-order.entity';
import { AbuseReportEntity } from './entities/abuse-report.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { ChatMessageEntity } from './entities/chat-message.entity';
import { FavoriteEntity } from './entities/favorite.entity';
import { CategoryRepository } from './repositories/category.repository';
import { FeeProfileRepository } from './repositories/fee-profile.repository';
import { ListingRepository } from './repositories/listing.repository';
import { KnzOrderRepository } from './repositories/knz-order.repository';
import { AbuseReportRepository } from './repositories/abuse-report.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { CategoriesAdminController } from './controllers/categories-admin.controller';
import { FeesAdminController } from './controllers/fees-admin.controller';
import { ReportingQueryController } from './controllers/reporting-query.controller';
import { ExportController } from './controllers/export.controller';
import { AbuseModerationController } from './controllers/abuse-moderation.controller';
import { SsotBridgeController } from './controllers/ssot-bridge.controller';
import { PublicBrowseController } from './controllers/public-browse.controller';
import { PublicListingController } from './controllers/public-listing.controller';
import { PublicChatController } from './controllers/public-chat.controller';
import { PublicOrderController } from './controllers/public-order.controller';
import { PublicReportingController } from './controllers/public-reporting.controller';
import { CategoriesAdminService } from './services/categories-admin.service';
import { FeesAdminService } from './services/fees-admin.service';
import { ReportingQueryService } from './services/reporting-query.service';
import { ExportService } from './services/export.service';
import { AbuseModerationService } from './services/abuse-moderation.service';
import { SsotBridgeService } from './services/ssot-bridge.service';
import { AuditLogService } from './services/audit-log.service';
import { BrowseService } from './services/browse.service';
import { PublicListingService } from './services/public-listing.service';
import { ChatService } from './services/chat.service';
import { PublicOrderService } from './services/public-order.service';
import { PublicAbuseReportService } from './services/public-abuse-report.service';
import { WalletBridgeService } from './services/wallet-bridge.service';
import { DlsBridgeService } from './services/dls-bridge.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      CategoryEntity,
      FeeProfileEntity,
      ListingEntity,
      KnzOrderEntity,
      AbuseReportEntity,
      AuditLogEntity,
      ChatMessageEntity,
      FavoriteEntity,
    ]),
  ],
  controllers: [
    CategoriesAdminController,
    FeesAdminController,
    ReportingQueryController,
    ExportController,
    AbuseModerationController,
    SsotBridgeController,
    PublicBrowseController,
    PublicListingController,
    PublicChatController,
    PublicOrderController,
    PublicReportingController,
  ],
  providers: [
    CategoryRepository,
    FeeProfileRepository,
    ListingRepository,
    KnzOrderRepository,
    AbuseReportRepository,
    AuditLogRepository,
    ChatMessageRepository,
    FavoriteRepository,
    CategoriesAdminService,
    FeesAdminService,
    ReportingQueryService,
    ExportService,
    AbuseModerationService,
    SsotBridgeService,
    AuditLogService,
    BrowseService,
    PublicListingService,
    ChatService,
    PublicOrderService,
    PublicAbuseReportService,
    WalletBridgeService,
    DlsBridgeService,
  ],
  exports: [
    CategoriesAdminService,
    FeesAdminService,
    ReportingQueryService,
    ExportService,
    AbuseModerationService,
    SsotBridgeService,
    AuditLogService,
    BrowseService,
    PublicListingService,
    ChatService,
    PublicOrderService,
    WalletBridgeService,
    DlsBridgeService,
  ],
})
export class KnzModule {}
