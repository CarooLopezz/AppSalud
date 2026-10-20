import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecetasService } from './recetas.service.js';
import { RecetasResolver } from './recetas.resolver.js';
import { Receta, RecetaSchema } from './schemas/receta.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Receta.name,
        schema: RecetaSchema,
      },
    ]),
  ],
  providers: [RecetasService, RecetasResolver],
  exports: [RecetasService],
})
export class RecetasModule {}