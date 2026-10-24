import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

// Errores que no pasan por ningún pedido (una promesa sin catch, un error suelto)
const logProceso = new Logger('Proceso');
process.on('unhandledRejection', (motivo) => {
  logProceso.error(
    'Promesa rechazada sin manejar',
    motivo instanceof Error ? motivo.stack : String(motivo),
  );
});
process.on('uncaughtException', (error) => {
  logProceso.error('Error no atrapado: el servicio se cierra', error.stack);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Detrás de nginx: usar la IP real del cliente (X-Forwarded-For) para que el
  // límite de intentos cuente por usuario y no a todos juntos.
  app.set('trust proxy', 1);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();