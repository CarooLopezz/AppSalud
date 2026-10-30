import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface UsuarioAutenticado {
  userId: string;
  email: string;
  rol: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UsuarioAutenticado => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
