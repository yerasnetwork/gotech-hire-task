import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Исправлено: добавлен ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: restrict in production
  // Исправлено: CORS origin читается из env переменной CORS_ORIGIN
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });

  // ValidationPipe intentionally not added
  // Исправлено: ValidationPipe активирован — теперь class-validator декораторы в DTO работают.
  // whitelist: true отбрасывает лишние поля, не описанные в DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3000);
  console.log('Server running on port 3000');
}
bootstrap();
