import { Field, InputType, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateEstudioInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tipo: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  especialidad: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medico: string;

  @Field(() => GraphQLISODateTime)
  @IsDate()
  fecha: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultado?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notas?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @IsDate()
  proximoControl?: Date;
}
