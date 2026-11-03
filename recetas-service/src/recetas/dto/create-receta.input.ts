import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateRecetaInput {
  @Field()
  pacienteId: string;

  @Field(() => ID)
  medicamentoId: string;

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

  @Field({ nullable: true })
  archivo?: string;

  @Field({ nullable: true })
  tipoArchivo?: string;
}