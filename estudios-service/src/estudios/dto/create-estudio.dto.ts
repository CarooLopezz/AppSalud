import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEstudioDto {
  @ApiProperty({ example: 'Análisis de sangre', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipo: string;

  @ApiProperty({ example: 'Clínica médica', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  especialidad: string;

  @ApiProperty({ example: 'Dra. Laura Méndez', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medico: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Fecha del estudio (ISO 8601)',
  })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ example: 'Valores normales.', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string;

  @ApiPropertyOptional({
    example: 'Llevar al próximo control.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @ApiPropertyOptional({
    example: '2027-03-15',
    description: 'Fecha del próximo control (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  proximoControl?: string;
}
