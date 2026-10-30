import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { EstudiosService } from './estudios.service.js';
import { CreateEstudioDto } from './dto/create-estudio.dto.js';
import { UpdateEstudioDto } from './dto/update-estudio.dto.js';
import { FiltrarEstudiosDto } from './dto/filtrar-estudios.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@ApiTags('Estudios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o es inválido' })
@Controller('estudios')
@UseGuards(JwtAuthGuard)
export class EstudiosController {
  constructor(private readonly estudiosService: EstudiosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un estudio del usuario autenticado' })
  @ApiCreatedResponse({ description: 'Estudio creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateEstudioDto) {
    return this.estudiosService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar y buscar estudios',
    description:
      'Sin parámetros devuelve todos los estudios del usuario. Se pueden combinar los filtros.',
  })
  @ApiOkResponse({ description: 'Lista de estudios (puede ser vacía)' })
  @ApiBadRequestResponse({
    description: 'Alguna fecha del filtro es inválida',
  })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filtros: FiltrarEstudiosDto,
  ) {
    return this.estudiosService.findAll(req.user.userId, filtros);
  }

  @Get('proximos-controles')
  @ApiOperation({
    summary: 'Controles que vencen en los próximos 30 días',
    description:
      'Devuelve los estudios cuyo proximoControl cae entre hoy y dentro de 30 días, de cualquier especialidad, ordenados por fecha.',
  })
  @ApiOkResponse({
    description: 'Lista de estudios con control próximo (puede ser vacía)',
  })
  findControlesProximos(@Req() req: AuthenticatedRequest) {
    return this.estudiosService.findControlesProximos(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un estudio por id' })
  @ApiParam({ name: 'id', description: 'Id del estudio (ObjectId de Mongo)' })
  @ApiOkResponse({ description: 'El estudio' })
  @ApiBadRequestResponse({ description: 'Id inválido' })
  @ApiNotFoundResponse({ description: 'Estudio no encontrado' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.estudiosService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un estudio (campos parciales)' })
  @ApiParam({ name: 'id', description: 'Id del estudio (ObjectId de Mongo)' })
  @ApiOkResponse({ description: 'Estudio actualizado' })
  @ApiBadRequestResponse({ description: 'Id o datos inválidos' })
  @ApiNotFoundResponse({ description: 'Estudio no encontrado' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEstudioDto,
  ) {
    return this.estudiosService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un estudio' })
  @ApiParam({ name: 'id', description: 'Id del estudio (ObjectId de Mongo)' })
  @ApiOkResponse({ description: 'Estudio eliminado' })
  @ApiBadRequestResponse({ description: 'Id inválido' })
  @ApiNotFoundResponse({ description: 'Estudio no encontrado' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.estudiosService.remove(req.user.userId, id);
    return { message: 'Estudio eliminado correctamente' };
  }
}
