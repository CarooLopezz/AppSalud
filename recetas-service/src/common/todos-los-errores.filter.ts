import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

// Atrapa todos los errores del servicio y los deja anotados en el log.
// - 4xx (error del que hizo el pedido): se anotan como aviso.
// - 5xx (error nuestro): se anotan como error, con el detalle completo.
// Nunca se anotan el cuerpo, los headers ni la query del pedido, para que no
// queden contraseñas ni tokens en los logs. Ante un 500, al usuario solo le
// llega un mensaje genérico; el detalle queda en el log.
@Catch()
export class TodosLosErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // GraphQL (recetas-service) responde sus errores por su cuenta:
    // solo se anotan y se devuelven para que Apollo arme la respuesta
    if (host.getType<string>() === 'graphql') {
      const info = host.getArgByIndex<{ parentType?: unknown; fieldName?: string }>(3);
      this.anotar(status, `GraphQL ${String(info?.parentType)}.${info?.fieldName}`, exception);
      return exception;
    }

    if (host.getType() !== 'http') {
      this.anotar(status, host.getType(), exception);
      return;
    }

    const { httpAdapter } = this.adapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const metodo = httpAdapter.getRequestMethod(req);
    const ruta = String(httpAdapter.getRequestUrl(req)).split('?')[0];

    this.anotar(status, `${metodo} ${ruta}`, exception);

    const cuerpo =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error interno del servidor',
          };
    httpAdapter.reply(ctx.getResponse(), cuerpo, status);
  }

  private anotar(status: number, donde: string, exception: unknown) {
    if (status >= 500) {
      const detalle =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${donde} → ${status}`, detalle);
    } else {
      this.logger.warn(`${donde} → ${status}: ${this.mensaje(exception)}`);
    }
  }

  private mensaje(exception: unknown): string {
    if (!(exception instanceof HttpException)) return String(exception);
    const res = exception.getResponse();
    const msg = typeof res === 'string' ? res : (res as { message?: unknown }).message;
    if (Array.isArray(msg)) return msg.join('; ');
    if (typeof msg === 'string') return msg;
    return msg === undefined ? exception.message : JSON.stringify(msg);
  }
}
