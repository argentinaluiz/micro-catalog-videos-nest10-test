import { IUseCase } from '../../../../shared/application/use-case-interface';
import { ICategoryRepository } from '../../../domain/category.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import {
  CategoryOutput,
  CategoryOutputMapper,
} from '../common/category-output';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { SaveCategoryInput } from './save-category.input';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export class SaveCategoryUseCase
  implements IUseCase<SaveCategoryInput, SaveCategoryOutput>
{
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(input: SaveCategoryInput): Promise<CategoryOutput> {
    const categoryId = new CategoryId(input.category_id);
    const category = await this.categoryRepo.findById(categoryId);

    return category
      ? this.updateCategory(input, category)
      : this.createCategory(input);
  }

  private async createCategory(input: SaveCategoryInput) {
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

  private async updateCategory(input: SaveCategoryInput, category: Category) {
    if (!category) {
      throw new NotFoundError(input.category_id, Category);
    }

    category.changeName(input.name);
    category.changeDescription(input.description);

    if (input.is_active === true) {
      category.activate();
    }

    if (input.is_active === false) {
      category.deactivate();
    }

    category.changeCreatedAt(input.created_at);

    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }

    await this.categoryRepo.update(category);

    return CategoryOutputMapper.toOutput(category);
  }
}

export type SaveCategoryOutput = CategoryOutput;
