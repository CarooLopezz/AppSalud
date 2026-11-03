import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TodosLosErroresFilter } from './common/todos-los-errores.filter.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    // Límite de intentos (contra fuerza bruta en el login). Configurable con
    // THROTTLE_LIMIT y THROTTLE_TTL (ms); por defecto, 5 intentos por minuto.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL')) || 60000,
          limit: Number(config.get('THROTTLE_LIMIT')) || 5,
        },
      ],
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Anota en el log todos los errores (ver common/todos-los-errores.filter.ts)
    { provide: APP_FILTER, useClass: TodosLosErroresFilter },
  ],
})
export class AppModule {}