import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

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
}
