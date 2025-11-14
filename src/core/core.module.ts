import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from './services/logger.service';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { RbacGuard } from './guards/rbac.guard';
import { StepUpGuard } from './guards/step-up.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { TraceInterceptor } from './interceptors/trace.interceptor';
import { MetricsService } from './services/metrics.service';
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const publicKey = configService.get<string>('JWT_PUBLIC_KEY');
        const secret = configService.get<string>('JWT_SECRET');
        const alg = configService.get<string>('JWT_ALG', 'RS256') as 'RS256' | 'HS256';
        const config: {
          publicKey?: string;
          secret?: string;
          signOptions?: { algorithm: 'RS256' | 'HS256' };
        } = {};
        if (publicKey) {
          config.publicKey = publicKey;
        }
        if (secret) {
          config.secret = secret;
        }
        config.signOptions = { algorithm: alg };
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: IdempotencyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_GUARD,
      useClass: StepUpGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    JwtStrategy,
    LoggerService,
    MetricsService,
  ],
  exports: [LoggerService, MetricsService, Reflector, JwtModule, PassportModule],
})
export class CoreModule {}
