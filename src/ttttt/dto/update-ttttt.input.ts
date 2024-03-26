import { CreateTttttInput } from './create-ttttt.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateTttttInput extends PartialType(CreateTttttInput) {
  @Field(() => Int)
  id: number;
}
