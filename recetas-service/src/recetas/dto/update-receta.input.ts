import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateRecetaInput } from './create-receta.input.js';

@InputType()
export class UpdateRecetaInput extends PartialType(CreateRecetaInput) {
  @Field(() => ID)
  id: string;
}