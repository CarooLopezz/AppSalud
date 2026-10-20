import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateMedicamentoInput {
  @Field()
  nombre: string;

  @Field({ nullable: true })
  principioActivo?: string;

  @Field({ nullable: true })
  presentacion?: string;

  @Field({ nullable: true })
  descripcion?: string;
}
