import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    rol: string;
  };
}

@Controller('users')
@ApiTags('Usuarios y médicos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('medicos')
  @ApiOperation({ summary: 'Listar médicos disponibles' })
  @ApiOkResponse({
    description:
      'Médicos ordenados por nombre. Solo se devuelven nombre y email.',
    schema: {
      example: [{ nombre: 'Laura Méndez', email: 'laura.mendez@appsalud.com' }],
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', example: 'Laura Méndez' },
          email: { type: 'string', example: 'laura.mendez@appsalud.com' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Falta un token JWT válido.' })
  findMedicos() {
    return this.usersService.findMedicos();
  }

  @Get('me')
  @ApiOperation({ summary: 'Ver los datos de la cuenta que inició sesión' })
  @ApiOkResponse({
    description: 'Nombre, email y rol del usuario del token (sin contraseña).',
    schema: {
      example: {
        _id: '6ae4d19af3f0ce1a653fd4a5',
        nombre: 'Ana García',
        email: 'ana@appsalud.com',
        rol: 'paciente',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Falta un token JWT válido.' })
  findCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.usersService.findById(request.user.userId);
  }
}
