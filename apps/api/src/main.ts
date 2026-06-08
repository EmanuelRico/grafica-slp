import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL || '*' });
  await app.listen(process.env.PORT || 3001);
  console.log(`API running on port ${process.env.PORT || 3001}`);

  // Keep-alive: self-ping every 10min to prevent Render cold starts
  const url = process.env.RENDER_EXTERNAL_URL || 'https://api.graficaslp.com';
  setInterval(() => {
    fetch(`${url}/api/v1/print-types`).then(() => console.log('[keep-alive] ping ok')).catch(() => {});
  }, 10 * 60 * 1000);
}
bootstrap();
