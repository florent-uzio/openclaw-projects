import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get('CLIENT_URL') || 'http://localhost:5176',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3002;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    X Bookmarks Server                        ║
╠══════════════════════════════════════════════════════════════╣
║  API:      http://localhost:${port}/api                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
