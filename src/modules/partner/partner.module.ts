import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { DshModule } from '../dsh/dsh.module';
import { ArbModule } from '../arb/arb.module';
import { WltModule } from '../wlt/wlt.module';
import { PartnerAuthController } from './controllers/partner-auth.controller';
import { PartnerPortalController } from './controllers/partner-portal.controller';
import { PartnerAuthService } from './services/partner-auth.service';
import { PartnerRoleService } from './services/partner-role.service';

@Module({
  imports: [CoreModule, SharedModule, DshModule, ArbModule, WltModule],
  controllers: [PartnerAuthController, PartnerPortalController],
  providers: [PartnerAuthService, PartnerRoleService],
  exports: [PartnerAuthService, PartnerRoleService],
})
export class PartnerModule {}

