import { Category } from '../../../domain/category.aggregate';

export type CategoryOutput = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class CategoryOutputMapper {
  static toOutput(entity: Category): CategoryOutput {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category_id, deleted_at, ...other_props } = entity.toJSON();
    return {
      id: category_id,
      ...other_props,
    };
  }
}
