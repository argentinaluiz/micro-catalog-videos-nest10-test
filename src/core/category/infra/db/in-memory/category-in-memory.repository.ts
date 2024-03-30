import { InMemoryRepository } from '../../../../shared/domain/repository/in-memory.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/category.repository';

export class CategoryInMemoryRepository
  extends InMemoryRepository<Category, CategoryId>
  implements ICategoryRepository
{
  sortableFields: string[] = ['name', 'created_at'];
  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
}
