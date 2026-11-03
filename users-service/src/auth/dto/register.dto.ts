import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Ana Pérez',
    description: 'Nombre de la persona usuaria.',
  })
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secreta123', minLength: 6 })
  @MinLength(6)
  password: string;
}
