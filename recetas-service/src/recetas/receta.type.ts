import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RecetaType {
  @Field(() => ID)
  id: string;

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