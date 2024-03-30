import { Category } from '../../../domain/category.aggregate';
import { CategoryInMemoryRepository } from './category-in-memory.repository';

describe('CategoryInMemoryRepository', () => {
  let repository: CategoryInMemoryRepository;

  beforeEach(() => (repository = new CategoryInMemoryRepository()));

  it('should getEntity return Category Entity', async () => {
    expect(repository.getEntity()).toStrictEqual(Category);
  });
});
