import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  profesional: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  especialidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
