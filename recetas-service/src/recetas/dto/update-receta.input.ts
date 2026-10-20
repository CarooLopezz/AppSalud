import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRecetaInput } from './create-receta.input.js';

@InputType()
export class UpdateRecetaInput extends PartialType(CreateRecetaInput) {
  @Field()
  id: string;
}