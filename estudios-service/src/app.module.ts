import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TodosLosErroresFilter } from './common/todos-los-errores.filter.js';
import { EstudiosModule } from './estudios/estudios.module.js';
import { AuthModule } from './auth/auth.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),

    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'estudios-service',
    }),

    AuthModule,
    EstudiosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Anota en el log todos los errores (ver common/todos-los-errores.filter.ts)
    { provide: APP_FILTER, useClass: TodosLosErroresFilter },
  ],
})
export class AppModule {}
