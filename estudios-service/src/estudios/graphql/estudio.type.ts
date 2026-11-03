import { Field, ID, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class EstudioType {
  @Field(() => ID)
  id: string;

  @Field()
  tipo: string;

  @Field()
  especialidad: string;

  @Field()
  medico: string;

  @Field(() => GraphQLISODateTime)
  fecha: Date;

  @Field({ nullable: true })
  resultado?: string;

  @Field({ nullable: true })
  notas?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  proximoControl?: Date;
}
