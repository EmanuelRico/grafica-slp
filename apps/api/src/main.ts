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

  // Keep-alive: self-ping every 10min during work hours (7am-9pm CST) to prevent Render cold starts
  const url = process.env.RENDER_EXTERNAL_URL || 'https://api.graficaslp.com';
  setInterval(() => {
    const hour = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false });
    if (+hour >= 9 && +hour < 19) {
      fetch(`${url}/api/v1/print-types`).catch(() => {});
    }
  }, 10 * 60 * 1000);
}
bootstrap();
