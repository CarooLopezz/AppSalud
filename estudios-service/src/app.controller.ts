import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Comprobar que el servicio está activo' })
  @ApiOkResponse({ description: 'Texto de saludo', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
