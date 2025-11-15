import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { DshModule } from './modules/dsh/dsh.module';
import { KnzModule } from './modules/knz/knz.module';
import { EsfModule } from './modules/esf/esf.module';
import { ArbModule } from './modules/arb/arb.module';
import { KwdModule } from './modules/kwd/kwd.module';
import { SndModule } from './modules/snd/snd.module';
import { WltModule } from './modules/wlt/wlt.module';
import { FieldModule } from './modules/field/field.module';
import { PartnerModule } from './modules/partner/partner.module';
import { CaptainModule } from './modules/captain/captain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: undefined, // TODO: Add Joi/Zod schema
    }),
    CoreModule,
    SharedModule,
    DshModule,
    KnzModule,
    EsfModule,
    ArbModule,
    KwdModule,
    WltModule,
    SndModule,
    PartnerModule,
    FieldModule,
    CaptainModule,
  ],
})
export class AppModule {}
