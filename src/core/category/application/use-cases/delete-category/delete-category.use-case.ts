import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';

export class DeleteCategoryUseCase implements IUseCase<string, void> {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(new CategoryId(id));

    if (!category) {
      throw new NotFoundError(id, Category);
    }

    category.markAsDeleted();

    await this.categoryRepository.update(category);
  }
}
