import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
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
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('medicos')
  findMedicos() {
    return this.usersService.findMedicos();
  }

  @Get('me')
  findCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.usersService.findById(request.user.userId);
  }
}
