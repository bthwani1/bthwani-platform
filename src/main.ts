import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from './core/services/logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  app.setGlobalPrefix('api');

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('BThwani Platform API')
    .setDescription('BThwani Platform API Documentation')
    .setVersion('1.0')
    .addServer('https://api-dev.bthwani.com', 'Development')
    .addServer('https://api-stage.bthwani.com', 'Staging')
    .addServer('https://api.bthwani.com', 'Production')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const port = process.env.HTTP_PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`, {
    port,
    environment: process.env.NODE_ENV || 'development',
  });
}

bootstrap();
