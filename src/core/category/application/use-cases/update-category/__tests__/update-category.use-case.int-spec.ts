import { UpdateCategoryUseCase } from '../update-category.use-case';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { UpdateCategoryInput } from '../update-category.input';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';

describe('UpdateCategoryUseCase Integration Tests', () => {
  let useCase: UpdateCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new UpdateCategoryUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(() =>
      useCase.execute(
        new UpdateCategoryInput({
          id: categoryId.id,
          name: 'fake',
          description: null,
          is_active: true,
          created_at: new Date(),
        }),
      ),
    ).rejects.toThrow(new NotFoundError(categoryId.id, Category));
  });

  it('should update a category', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);

    const new_created_at = new Date();
    const output = await useCase.execute(
      new UpdateCategoryInput({
        id: entity.category_id.id,
        name: 'test',
        description: 'description changed',
        is_active: false,
        created_at: new_created_at,
      }),
    );
    expect(output).toStrictEqual({
      id: entity.category_id.id,
      name: 'test',
      description: 'description changed',
      is_active: false,
      created_at: new_created_at,
    });
  });
});
