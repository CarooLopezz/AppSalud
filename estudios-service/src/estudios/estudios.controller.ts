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
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { EstudiosService } from './estudios.service.js';
import { CreateEstudioDto } from './dto/create-estudio.dto.js';
import { FiltrarEstudiosDto } from './dto/filtrar-estudios.dto.js';
import { UpdateEstudioDto } from './dto/update-estudio.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('estudios')
@UseGuards(JwtAuthGuard)
export class EstudiosController {
  constructor(private readonly estudiosService: EstudiosService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateEstudioDto) {
    return this.estudiosService.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filtros: FiltrarEstudiosDto,
  ) {
    return this.estudiosService.findAll(req.user.userId, filtros);
  }

  @Get('proximos-controles')
  findControlesProximos(@Req() req: AuthenticatedRequest) {
    return this.estudiosService.findControlesProximos(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.estudiosService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEstudioDto,
  ) {
    return this.estudiosService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.estudiosService.remove(req.user.userId, id);
    return { message: 'Estudio eliminado correctamente' };
  }
}
