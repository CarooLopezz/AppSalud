import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RecetasService } from './recetas.service.js';
import { RecetaType } from './receta.type.js';
import { CreateRecetaInput } from './dto/create-receta.input.js';
import { UpdateRecetaInput } from './dto/update-receta.input.js';

@Resolver(() => RecetaType)
export class RecetasResolver {
  constructor(private readonly recetasService: RecetasService) {}

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
}