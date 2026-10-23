import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicamentosService } from './medicamentos.service.js';
import { MedicamentosResolver } from './medicamentos.resolver.js';
import {
  Medicamento,
  MedicamentoSchema,
} from './schemas/medicamento.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Medicamento.name,
        schema: MedicamentoSchema,
      },
    ]),
  ],
  providers: [MedicamentosService, MedicamentosResolver],
  exports: [MedicamentosService],
})
export class MedicamentosModule {}
