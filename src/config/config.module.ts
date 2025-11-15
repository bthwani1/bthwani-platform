import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigService } from './services/config.service';
import { ConfigRepository } from './repositories/config.repository';
import { ConfigController } from './controllers/config.controller';
import { ConfigValidationGuard } from './guards/config-validation.guard';
import { RuntimeConfigEntity } from './entities/runtime-config.entity';
import { envSchema } from './env.schema';

/**
 * Global configuration module with control panel support
 * Provides enhanced config service with runtime configuration management
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    MikroOrmModule.forFeature([RuntimeConfigEntity]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService, ConfigRepository, ConfigValidationGuard],
  exports: [ConfigService, ConfigValidationGuard],
})
export class ConfigModule {}

