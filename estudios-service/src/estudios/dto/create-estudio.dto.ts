
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEstudioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  especialidad: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medico: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @IsOptional()
  @IsDateString()
  proximoControl?: string;
}
