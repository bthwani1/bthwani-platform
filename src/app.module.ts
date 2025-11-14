import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { DshModule } from './modules/dsh/dsh.module';

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
  ],
})
export class AppModule {}
