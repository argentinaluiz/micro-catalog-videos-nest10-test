import { IUseCase } from '../../../../shared/application/use-case-interface';
import { ICategoryRepository } from '../../../domain/category.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import {
  CategoryOutput,
  CategoryOutputMapper,
} from '../common/category-output';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { CreateCategoryInput } from './create-category.input';

export class CreateCategoryUseCase
  implements IUseCase<CreateCategoryInput, CreateCategoryOutput>
{
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CategoryOutput> {
    const entity = Category.create({
      ...input,
      category_id: new CategoryId(input.category_id),
    });
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }
    await this.categoryRepo.insert(entity);
    return CategoryOutputMapper.toOutput(entity);
  }
}

export type CreateCategoryOutput = CategoryOutput;
