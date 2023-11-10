import { Either } from '../../../shared/domain/either';
import { NotFoundError } from '../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../domain/category.aggregate';
import { ICategoryRepository } from '../../domain/category.repository';

export class CategoriesIdsValidator {
  constructor(private categoryRepo: ICategoryRepository) {}

  async validate(
    categories_id: string[],
  ): Promise<Either<CategoryId[], NotFoundError[]>> {
    const categoriesId = categories_id.map((id) => new CategoryId(id));

    const existsResults = await this.categoryRepo.existsById(categoriesId);
    return existsResults.not_exists.length > 0
      ? Either.fail(
          existsResults.not_exists.map(
            (c) => new NotFoundError(c.id, Category),
          ),
        )
      : Either.ok(categoriesId);
  }
}
