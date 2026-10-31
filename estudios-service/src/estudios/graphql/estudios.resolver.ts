import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import type { UsuarioAutenticado } from '../../auth/current-user.decorator.js';

import { EstudiosService } from '../estudios.service.js';

import { EstudioType } from './estudio.type.js';
import { CreateEstudioInput } from './create-estudio.input.js';
import { UpdateEstudioInput } from './update-estudio.input.js';
import { FiltrarEstudiosInput } from './filtrar-estudios.input.js';

@Resolver(() => EstudioType)
@UseGuards(JwtAuthGuard)
export class EstudiosResolver {
  constructor(private readonly estudiosService: EstudiosService) {}

  // Crear un estudio
  @Mutation(() => EstudioType)
  crearEstudio(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Args('input') input: CreateEstudioInput,
  ) {
    return this.estudiosService.create(usuario.userId, {
      ...input,
      fecha: input.fecha.toISOString(),
      proximoControl: input.proximoControl?.toISOString(),
    });
  }

  // Consultar todos los estudios con filtros opcionales
  @Query(() => [EstudioType])
  estudios(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Args('filtros', { type: () => FiltrarEstudiosInput, nullable: true })
    filtros?: FiltrarEstudiosInput,
  ) {
    return this.estudiosService.findAll(usuario.userId, {
      ...filtros,
      fecha: filtros?.fecha?.toISOString(),
      desde: filtros?.desde?.toISOString(),
      hasta: filtros?.hasta?.toISOString(),
    });
  }

  // Consultar un estudio por ID
  @Query(() => EstudioType)
  estudio(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.estudiosService.findOne(usuario.userId, id);
  }

  // Consultar controles próximos
  @Query(() => [EstudioType])
  controlesProximos(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.estudiosService.findControlesProximos(usuario.userId);
  }

  // Actualizar un estudio
  @Mutation(() => EstudioType)
  actualizarEstudio(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Args('input') input: UpdateEstudioInput,
  ) {
    const { id, ...datos } = input;

    return this.estudiosService.update(usuario.userId, id, {
      ...datos,
      fecha: datos.fecha?.toISOString(),
      proximoControl: datos.proximoControl?.toISOString(),
    });
  }

  // Eliminar un estudio
  @Mutation(() => Boolean)
  async eliminarEstudio(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.estudiosService.remove(usuario.userId, id);
    return true;
  }
}
