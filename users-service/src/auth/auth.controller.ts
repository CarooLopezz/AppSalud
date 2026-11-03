import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

// Limita los intentos de registro y login (ver ThrottlerModule en app.module.ts).
// Al pasarse del límite, NestJS responde 429 "Too many requests".
@Controller('auth')
@ApiTags('Autenticación')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar una cuenta de paciente' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description:
      'Cuenta creada. El registro público siempre asigna el rol paciente.',
    schema: {
      example: {
        id: '665f1a2b3c4d5e6f7890abcd',
        nombre: 'Ana Pérez',
        email: 'ana@example.com',
        rol: 'paciente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o contraseña menor a 6 caracteres.',
  })
  @ApiConflictResponse({ description: 'El email ya está registrado.' })
  @ApiTooManyRequestsResponse({
    description: 'Se superó el límite de intentos por IP.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token JWT' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Autenticación exitosa.',
    schema: {
      example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiBadRequestResponse({
    description: 'Email o contraseña con formato inválido.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas.' })
  @ApiTooManyRequestsResponse({
    description: 'Se superó el límite de intentos por IP.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
