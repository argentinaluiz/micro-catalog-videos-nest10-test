import { ISearchableRepository } from '../../shared/domain/repository/repository.interface';
import {
  SearchParams as DefaultSearchParams,
  SearchResult as DefaultSearchResult,
} from '../../shared/domain/repository/search-params';
import { Category, CategoryId } from './category.aggregate';

export type CategoryFilter = string;

export class CategorySearchParams extends DefaultSearchParams<CategoryFilter> {}

export class CategorySearchResult extends DefaultSearchResult<Category> {}

export interface ICategoryRepository
  extends ISearchableRepository<
    Category,
    CategoryId,
    CategoryFilter,
    CategorySearchParams,
    CategorySearchResult
  > {}
