import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType('Category')
export class CategoryGraphql {
  @Field(() => String, { description: 'Id of the category' })
  id: string;

  @Field(() => String, { description: 'Name of the category' })
  name: string;

  @Field(() => String, { description: 'Description of the category' })
  description: string;

  @Field(() => Boolean, { description: 'Whether the category is active' })
  is_active: boolean;

  @Field(() => Date, { description: 'Date the category was created' })
  created_at: Date;

  constructor(category: any) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.is_active = category.is_active;
    this.created_at = category.created_at;
  }
}
