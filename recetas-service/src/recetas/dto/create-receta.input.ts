import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateRecetaInput {
  @Field()
  pacienteId: string;

  @Field()
  medicamento: string;

  @Field()
  dosis: string;

  @Field()
  frecuencia: string;

  @Field()
  duracion: string;

  @Field({ nullable: true })
  indicaciones?: string;

  @Field()
  fecha: string;
}