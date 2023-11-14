import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { UnitOfWorkFakeInMemory } from '../../../../../shared/infra/db/in-memory/fake-unit-work-in-memory';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { GetCategoryUseCase } from '../get-category.use-case';

describe('GetCategoryUseCase Unit Tests', () => {
  let useCase: GetCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository(new UnitOfWorkFakeInMemory());
    useCase = new GetCategoryUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );
  });

  it('should returns a category', async () => {
    const items = [
      Category.create({
        category_id: new CategoryId(),
        name: 'Movie',
        description: 'some description',
        is_active: true,
        created_at: new Date(),
      }),
    ];
    repository.items = items;
    const spyFindById = jest.spyOn(repository, 'findById');
    const output = await useCase.execute({ id: items[0].category_id.id });
    expect(spyFindById).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: items[0].category_id.id,
      name: 'Movie',
      description: 'some description',
      is_active: true,
      created_at: items[0].created_at,
    });
  });
});
