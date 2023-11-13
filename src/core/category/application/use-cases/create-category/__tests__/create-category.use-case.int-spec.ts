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
    let output = await useCase.execute(
      new CreateCategoryInput({ name: 'test' }),
    );
    let entity = await repository.findById(new CategoryId(output.id));
    expect(output).toStrictEqual({
      id: entity!.category_id.id,
      name: 'test',
      description: null,
      is_active: true,
      created_at: entity!.created_at,
    });

    output = await useCase.execute(
      new CreateCategoryInput({
        name: 'test',
        description: 'some description',
      }),
    );
    entity = await repository.findById(new CategoryId(output.id));
    expect(output).toStrictEqual({
      id: entity!.category_id.id,
      name: 'test',
      description: 'some description',
      is_active: true,
      created_at: entity!.created_at,
    });

    output = await useCase.execute({
      name: 'test',
      description: 'some description',
      is_active: true,
    });
    entity = await repository.findById(new CategoryId(output.id));
    expect(output).toStrictEqual({
      id: entity!.category_id.id,
      name: 'test',
      description: 'some description',
      is_active: true,
      created_at: entity!.created_at,
    });

    output = await useCase.execute({
      name: 'test',
      description: 'some description',
      is_active: false,
    });
    entity = await repository.findById(new CategoryId(output.id));
    expect(output).toStrictEqual({
      id: entity!.category_id.id,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: entity!.created_at,
    });
  });
});
