import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FiltrarEstudiosDto {
  @ApiPropertyOptional({
    example: 'Cardiología',
    description: 'Búsqueda parcial, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidad?: string;

  @ApiPropertyOptional({
    example: 'Análisis',
    description: 'Búsqueda parcial, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipo?: string;

  @ApiPropertyOptional({
    example: 'Ruiz',
    description: 'Búsqueda parcial, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  medico?: string;

  @ApiPropertyOptional({
    example: '2026-09-15',
    description: 'Estudios de ese día exacto',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Estudios desde esta fecha (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Estudios hasta esta fecha (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}