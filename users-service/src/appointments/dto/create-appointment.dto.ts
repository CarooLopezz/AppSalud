import { IsDateString, IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  medicoId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;
}
