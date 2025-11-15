import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnifiedSearchService } from './services/unified-search.service';
import { RuntimeVariablesService } from './services/runtime-variables.service';
import { SmartEngineService } from './services/smart-engine.service';
import { BannerService } from './services/banner.service';
import { DshSearchAdapter } from './adapters/search/dsh-search.adapter';
import { KnzSearchAdapter } from './adapters/search/knz-search.adapter';
import { ArbSearchAdapter } from './adapters/search/arb-search.adapter';
import {
  GoogleVoiceAdapter,
  AzureVoiceAdapter,
  AwsVoiceAdapter,
} from './adapters/voice';
import {
  GoogleImageAdapter,
  AzureImageAdapter,
  AwsImageAdapter,
} from './adapters/image';
import { forwardRef } from '@nestjs/common';
import { DshModule } from '../modules/dsh/dsh.module';
import { KnzModule } from '../modules/knz/knz.module';
import { ArbModule } from '../modules/arb/arb.module';
import { BannerEntity } from './entities/banner.entity';
import { BannerRepository } from './repositories/banner.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UnifiedSearchController } from './controllers/unified-search.controller';
import { BannersController } from './controllers/banners.controller';
import { BannersAdminController } from './controllers/banners-admin.controller';

/**
 * Shared Module
 *
 * Provides cross-cutting services used across all modules:
 * - UnifiedSearchService: Unified search across all services
 * - RuntimeVariablesService: Centralized runtime variables management
 * - SmartEngineService: Intelligent ranking and suggestions
 * - BannerService: Dynamic banners for DSH/KNZ/ARB
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forFeature([BannerEntity]),
    forwardRef(() => DshModule),
    forwardRef(() => KnzModule),
    forwardRef(() => ArbModule),
  ],
  controllers: [UnifiedSearchController, BannersController, BannersAdminController],
  providers: [
    UnifiedSearchService,
    RuntimeVariablesService,
    SmartEngineService,
    BannerService,
    BannerRepository,
    // Search Adapters
    DshSearchAdapter,
    KnzSearchAdapter,
    ArbSearchAdapter,
    // Voice Adapters
    GoogleVoiceAdapter,
    AzureVoiceAdapter,
    AwsVoiceAdapter,
    // Image Adapters
    GoogleImageAdapter,
    AzureImageAdapter,
    AwsImageAdapter,
  ],
  exports: [
    UnifiedSearchService,
    RuntimeVariablesService,
    SmartEngineService,
    BannerService,
    // Search Adapters
    DshSearchAdapter,
    KnzSearchAdapter,
    ArbSearchAdapter,
  ],
})
export class SharedModule {}
