import { CreateCategoryUseCase } from '../create-category.use-case';

import { CategoryId } from '../../../../domain/category.aggregate';
import { CreateCategoryInput } from '../create-category.input';
import { CategoryElasticSearchRepository } from '../../../../infra/db/elastic-search/category-elastic-search';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';

describe('CreateCategoryUseCase Integration Tests', () => {
  let useCase: CreateCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new CreateCategoryUseCase(repository);
  });

  it('should create a category', async () => {
    const uuid = '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e';
    const created_at = new Date();
    const output = await useCase.execute(
      new CreateCategoryInput({
        category_id: '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e',
        name: 'test',
        description: 'some description',
        is_active: false,
        created_at: created_at,
      }),
    );
    const entity = await repository.findById(new CategoryId(uuid));
    expect(output).toStrictEqual({
      id: uuid,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at,
    });
    expect(entity).toMatchObject({
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at,
    });
  });
});
