import { InMemorySearchableRepository } from '../../../../shared/domain/repository/in-memory.repository';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import {
  ICategoryRepository,
  CategoryFilter,
} from '../../../domain/category.repository';

export class CategoryInMemoryRepository
  extends InMemorySearchableRepository<Category, CategoryId, CategoryFilter>
  implements ICategoryRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }

  protected async applyFilter(
    items: Category[],
    filter: CategoryFilter | null,
  ): Promise<Category[]> {
    if (!filter) {
      return items.filter((i) => !this.isDeleted(i));
    }

    return items.filter((i) => {
      if (this.isDeleted(i)) {
        return false;
      }
      const clauseName =
        filter.name &&
        i.name.toLowerCase().includes(filter.name!.toLowerCase());
      const clauseIsActive =
        'is_active' in filter && i.is_active === filter.is_active;
      return filter.name && 'is_active' in filter
        ? clauseName && clauseIsActive
        : filter.name
          ? clauseName
          : clauseIsActive;
    });
  }

  protected async applySort(
    items: Category[],
    sort: string | null,
    sort_dir: SortDirection | null,
  ): Promise<Category[]> {
    return !sort
      ? super.applySort(items, 'created_at', 'desc')
      : super.applySort(items, sort, sort_dir);
  }
}
