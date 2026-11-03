import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Estudio, EstudioSchema } from './estudio.schema.js';
import { EstudiosController } from './estudios.controller.js';
import { EstudiosService } from './estudios.service.js';
import { EstudiosResolver } from './graphql/estudios.resolver.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Estudio.name, schema: EstudioSchema }]),
  ],
  controllers: [EstudiosController],
  providers: [EstudiosService, EstudiosResolver],
  exports: [EstudiosService],
})
export class EstudiosModule {}
