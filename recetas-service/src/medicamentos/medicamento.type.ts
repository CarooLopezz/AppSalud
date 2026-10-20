import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MedicamentoType {
  @Field(() => ID)
  id: string;

  @Field()
  nombre: string;

  @Field({ nullable: true })
  principioActivo?: string;

  @Field({ nullable: true })
  presentacion?: string;

  @Field({ nullable: true })
  descripcion?: string;
}
