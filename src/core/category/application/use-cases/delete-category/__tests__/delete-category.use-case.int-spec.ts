import { DeleteCategoryUseCase } from '../delete-category.use-case';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';

describe('DeleteCategoryUseCase Integration Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute(categoryId.id)).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );
  });

  it('should delete a category', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    await useCase.execute(category.category_id.id);
    const noEntity = await repository.findById(category.category_id);
    expect(noEntity).toBeNull();
  });
});
