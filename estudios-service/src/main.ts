import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger: documentación de la API REST en /docs
  const config = new DocumentBuilder()
    .setTitle('AppSalud - estudios-service')
    .setDescription(
      'API REST de estudios y controles médicos. El CRUD en GraphQL está en /graphql.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3002);
}

await bootstrap();
