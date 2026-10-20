import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MedicamentosService } from './medicamentos.service.js';
import { MedicamentoType } from './medicamento.type.js';
import { CreateMedicamentoInput } from './dto/create-medicamento.input.js';
import { UpdateMedicamentoInput } from './dto/update-medicamento.input.js';

@Resolver(() => MedicamentoType)
export class MedicamentosResolver {
  constructor(
    private readonly medicamentosService: MedicamentosService,
  ) {}

  @Mutation(() => MedicamentoType)
  crearMedicamento(
    @Args('input') input: CreateMedicamentoInput,
  ) {
    return this.medicamentosService.crear(input);
  }

  @Query(() => [MedicamentoType])
  medicamentos() {
    return this.medicamentosService.listar();
  }

  @Query(() => MedicamentoType)
  medicamento(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.medicamentosService.buscarPorId(id);
  }

  @Mutation(() => MedicamentoType)
  actualizarMedicamento(
    @Args('input') input: UpdateMedicamentoInput,
  ) {
    return this.medicamentosService.actualizar(input);
  }

  @Mutation(() => Boolean)
  eliminarMedicamento(
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.medicamentosService.eliminar(id);
  }
}
