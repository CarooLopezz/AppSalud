import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Aplicación')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener mensaje de la aplicación',
    description:
      'Devuelve un mensaje de prueba para verificar que la API está funcionando.',
  })
  @ApiResponse({
    status: 200,
    description: 'La aplicación respondió correctamente.',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}