import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    rol: string;
  };
}

interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Se requiere iniciar sesión');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }

    if (!payload.sub || !payload.email || !payload.rol) {
      throw new UnauthorizedException('Token inválido');
    }

    request.user = {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
    return true;
  }
}
