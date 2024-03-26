import {
  SearchParams,
  SearchParamsConstructorProps,
} from '../../shared/domain/repository/search-params';
import { SearchResult } from '../../shared/domain/repository/search-result';
import { ISearchableRepository } from '../../shared/domain/repository/repository.interface';
import { Category, CategoryId } from './category.aggregate';

export type CategoryFilter = {
  name?: string | null;
  is_active?: boolean;
};

export class CategorySearchParams extends SearchParams<CategoryFilter> {
  private constructor(props: SearchParamsConstructorProps<CategoryFilter>) {
    super(props);
  }

  static create(
    props: Omit<SearchParamsConstructorProps<CategoryFilter>, 'filter'> & {
      filter?: {
        name?: string | null;
        is_active?: boolean;
      };
    } = {},
  ) {
    return new CategorySearchParams({
      ...props,
      filter: {
        name: props.filter?.name,
        is_active: props.filter?.is_active,
      },
    });
  }

  get filter(): CategoryFilter | null {
    return this._filter;
  }

  protected set filter(value: CategoryFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.name && { name: `${_value?.name}` }),
      ...(_value &&
        _value.is_active !== undefined && {
          is_active:
            _value.is_active === ('true' as any) ||
            _value.is_active === true ||
            _value.is_active === (1 as any) ||
            _value.is_active === ('1' as any),
        }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class CategorySearchResult extends SearchResult<Category> {}

export interface ICategoryRepository
  extends ISearchableRepository<
    Category,
    CategoryId,
    CategoryFilter,
    CategorySearchParams,
    CategorySearchResult
  > {}
