import { InMemorySearchableRepository } from '../../../../shared/domain/repository/in-memory.repository';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import {
  IGenreRepository,
  GenreFilter,
} from '../../../domain/genre.repository';

export class GenreInMemoryRepository
  extends InMemorySearchableRepository<Genre, GenreId, GenreFilter>
  implements IGenreRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => Genre {
    return Genre;
  }

  protected async applyFilter(
    items: Genre[],
    filter: GenreFilter | null,
  ): Promise<Genre[]> {
    if (!filter) {
      return items.filter((i) => !this.isDeleted(i));
    }

    return items.filter((genre) => {
      if (this.isDeleted(genre)) {
        return false;
      }

      const containsName =
        filter.name &&
        genre.name.toLowerCase().includes(filter.name.toLowerCase());
      const containsCategoriesId =
        filter.categories_id &&
        filter.categories_id.some((c) => genre.categories.has(c.id));
      return filter.name && filter.categories_id
        ? containsName && containsCategoriesId
        : filter.name
          ? containsName
          : containsCategoriesId;
    });
  }

  protected async applySort(
    items: Genre[],
    sort: string | null,
    sort_dir: SortDirection | null,
  ): Promise<Genre[]> {
    return !sort
      ? super.applySort(items, 'created_at', 'desc')
      : super.applySort(items, sort, sort_dir);
  }
}
