import { GetCategoryUseCase } from '../get-category.use-case';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';

describe('GetCategoryUseCase Integration Tests', () => {
  let useCase: GetCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new GetCategoryUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );
  });

  it('should returns a category', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    const output = await useCase.execute({ id: category.category_id.id });
    expect(output).toStrictEqual({
      id: category.category_id.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
    });
  });
});
