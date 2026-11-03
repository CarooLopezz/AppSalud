
import {
  Args,
  ID,
  Mutation,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { RecetasService } from './recetas.service.js';
import { RecetaType } from './receta.type.js';
import { CreateRecetaInput } from './dto/create-receta.input.js';
import { UpdateRecetaInput } from './dto/update-receta.input.js';
import { MedicamentoType } from '../medicamentos/medicamento.type.js';
import { MedicamentosService } from '../medicamentos/medicamentos.service.js';
import type { RecetaDocument } from './schemas/receta.schema.js';

@Resolver(() => RecetaType)
export class RecetasResolver {
  constructor(
    private readonly recetasService: RecetasService,
    private readonly medicamentosService: MedicamentosService,
  ) {}

  @Mutation(() => RecetaType)
  crearReceta(
    @Args('input') input: CreateRecetaInput,
  ) {
    return this.recetasService.crear(input);
  }

  @Query(() => [RecetaType])
  recetas() {
    return this.recetasService.listar();
  }

  @Query(() => RecetaType)
  receta(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.recetasService.buscarPorId(id);
  }

  @Query(() => [RecetaType])
  recetasPorVencer() {
    return this.recetasService.recetasPorVencer();
  }

  @Mutation(() => RecetaType)
  actualizarReceta(
    @Args('input') input: UpdateRecetaInput,
  ) {
    return this.recetasService.actualizar(input);
  }

  @Mutation(() => Boolean)
  eliminarReceta(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.recetasService.eliminar(id);
  }

  @ResolveField(() => MedicamentoType)
  async medicamento(receta: RecetaDocument) {
    return this.medicamentosService.buscarPorId(receta.medicamentoId);
  }
}
