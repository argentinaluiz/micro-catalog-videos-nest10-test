import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { UnitOfWorkFakeInMemory } from '../../../../../shared/infra/db/in-memory/fake-unit-work-in-memory';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { UpdateCategoryInput } from '../update-category.input';
import { UpdateCategoryUseCase } from '../update-category.use-case';

describe('UpdateCategoryUseCase Unit Tests', () => {
  let useCase: UpdateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository(new UnitOfWorkFakeInMemory());
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

  it('should throw an error when entity is not valid', async () => {
    const category_id = new CategoryId();
    const entity = new Category({
      category_id,
      name: 'Movie',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    repository.items = [entity];
    await expect(() =>
      useCase.execute(
        new UpdateCategoryInput({
          id: entity.category_id.id,
          name: 't'.repeat(256),
          description: null,
          is_active: true,
          created_at: new Date(),
        }),
      ),
    ).rejects.toThrowError('Entity Validation Error');
  });

  it('should update a category', async () => {
    const spyUpdate = jest.spyOn(repository, 'update');
    const category_id = new CategoryId();
    const entity = new Category({
      category_id,
      name: 'Movie',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    repository.items = [entity];

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
    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: entity.category_id.id,
      name: 'test',
      description: 'description changed',
      is_active: false,
      created_at: new_created_at,
    });
  });
});
