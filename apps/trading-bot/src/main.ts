import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for dashboard
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('XRP Trading Bot API')
    .setDescription('API for the XRP trading bot')
    .setVersion('1.0')
    .addTag('bot', 'Bot control endpoints')
    .addTag('trades', 'Trade history endpoints')
    .addTag('config', 'Configuration endpoints')
    .addTag('stats', 'Statistics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    XRP Trading Bot                           ║
╠══════════════════════════════════════════════════════════════╣
║  API:      http://localhost:${port}/api                         ║
║  Docs:     http://localhost:${port}/docs                        ║
║  WebSocket: ws://localhost:${port}                              ║
╠══════════════════════════════════════════════════════════════╣
║  Mode: ${process.env.PAPER_TRADING === 'false' ? '🔴 LIVE TRADING' : '📝 PAPER TRADING'}                                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
