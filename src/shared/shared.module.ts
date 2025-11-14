import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { WltService } from './services/wlt.service';
import { CatalogService } from './services/catalog.service';
import { PricingService } from './services/pricing.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [WltService, CatalogService, PricingService],
  exports: [WltService, CatalogService, PricingService],
})
export class SharedModule {}
