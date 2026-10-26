import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AppointmentsService } from './appointments.service.js';
import type { UsuarioAutenticado } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';

interface AuthenticatedRequest extends Request {
  user: UsuarioAutenticado;
}

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(request.user, dto);
  }

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.findAll(request.user);
  }

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.appointmentsService.findOne(request.user, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(request.user, id, dto);
  }

  @Patch(':id/estado')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(request.user, id, dto.estado);
  }

  @Delete(':id')
  cancel(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.appointmentsService.cancel(request.user, id);
  }
}
