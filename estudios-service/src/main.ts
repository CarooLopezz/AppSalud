import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';

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
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();
  await app.listen(process.env.PORT ?? 3002);
}

await bootstrap();
