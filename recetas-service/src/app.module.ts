import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RecetasModule } from './recetas/recetas.module.js';
import { MedicamentosModule } from './medicamentos/medicamentos.module.js';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // En producción (Docker) el esquema queda en memoria: no hay carpeta src
      autoSchemaFile:
        process.env.NODE_ENV === 'production'
          ? true
          : join(process.cwd(), 'src/schema.gql'),
    }),

    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/appsalud',
    ),

    RecetasModule,
MedicamentosModule,
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'recetas-service',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
