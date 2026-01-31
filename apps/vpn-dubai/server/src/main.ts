import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  const configService = app.get(ConfigService);

  // CORS for frontend
  app.enableCors({
    origin: configService.get('CLIENT_URL') || 'http://localhost:5174',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Dubai VPN Server (NestJS)                 ║
╠══════════════════════════════════════════════════════════════╣
║  API:      http://localhost:${port}/api                         ║
║  Webhook:  http://localhost:${port}/api/stripe/webhook          ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${configService.get('NODE_ENV') || 'development'}                                ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
