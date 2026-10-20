import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateMedicamentoInput } from './create-medicamento.input.js';

@InputType()
export class UpdateMedicamentoInput extends PartialType(CreateMedicamentoInput) {
  @Field()
  id: string;
}
