import { UnitOfWorkFakeInMemory } from '../../../../../shared/infra/db/in-memory/fake-unit-work-in-memory';
import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { CreateCategoryInput } from '../create-category.input';
import { CreateCategoryUseCase } from '../create-category.use-case';

describe('CreateCategoryUseCase Unit Tests', () => {
  let useCase: CreateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository(new UnitOfWorkFakeInMemory());
    useCase = new CreateCategoryUseCase(repository);
  });

  it('should throw an error when entity is not valid', async () => {
    const input = new CreateCategoryInput({
      category_id: '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e',
      name: 't'.repeat(256),
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await expect(() => useCase.execute(input)).rejects.toThrowError(
      'Entity Validation Error',
    );
  });

  it('should create a category', async () => {
    const spyInsert = jest.spyOn(repository, 'insert');
    const input = new CreateCategoryInput({
      category_id: '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e',
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    const output = await useCase.execute(input);
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: repository.items[0].category_id.id,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: repository.items[0].created_at,
    });
  });
});
