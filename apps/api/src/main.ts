import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { AppModule } from './app.module';

function formatValidationErrors(errors: ValidationError[]): string {
  const fieldLabels: Record<string, string> = {
    company: 'Empresa',
    concept: 'Concepto',
    category: 'Categoría',
    provider: 'Proveedor',
    bankAccount: 'Cuenta bancaria',
    periodMonth: 'Mes del periodo',
    periodYear: 'Año del periodo',
    amount: 'Monto',
    dueDate: 'Fecha límite',
    recurrence: 'Recurrencia',
    paymentNotes: 'Notas',
    paidAt: 'Fecha de pago',
    name: 'Nombre',
    shortName: 'Nombre corto',
    rfc: 'RFC',
    color: 'Color',
    description: 'Descripción',
    bankName: 'Banco',
    lastFourDigits: 'Últimos 4 dígitos',
    companies: 'Empresas',
    email: 'Correo electrónico',
    password: 'Contraseña',
    status: 'Estado',
    note: 'Nota',
  };

  const messages = errors.map(err => {
    const field = fieldLabels[err.property] || err.property;
    const constraints = err.constraints ? Object.values(err.constraints) : [];

    if (constraints.some(c => c.includes('should not be empty') || c.includes('must be a string') || c.includes('must be a number'))) {
      return `${field} es requerido`;
    }
    if (constraints.some(c => c.includes('must not be less than'))) {
      return `${field} debe ser mayor a 0`;
    }
    if (constraints.some(c => c.includes('must be an email'))) {
      return `${field} no es válido`;
    }
    if (constraints.some(c => c.includes('must be one of'))) {
      return `${field} tiene un valor no permitido`;
    }
    return `${field} no es válido`;
  });

  return messages.join('. ');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => {
      return new BadRequestException(formatValidationErrors(errors));
    },
  }));
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
