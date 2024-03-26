import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateTttttInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
