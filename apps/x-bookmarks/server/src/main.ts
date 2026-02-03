import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Serve static frontend in production
  if (process.env.NODE_ENV === 'production') {
    const staticPath = join(__dirname, '..', 'client');
    app.useStaticAssets(staticPath);
    app.setBaseViewsDir(staticPath);
    
    // Fallback to index.html for SPA routing
    const express = app.getHttpAdapter().getInstance();
    express.get('*', (req: any, res: any, next: any) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(join(staticPath, 'index.html'));
    });
  }

  const port = configService.get('PORT') || 3002;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    X Bookmarks Server                        ║
╠══════════════════════════════════════════════════════════════╣
║  URL:      http://localhost:${port}                             ║
║  API:      http://localhost:${port}/api                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
