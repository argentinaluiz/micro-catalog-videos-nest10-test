import { AggregateRoot } from '../aggregate-root';
import { InvalidArgumentError } from '../errors/invalid-argument.error';
import { NotFoundError } from '../errors/not-found.error';
import { ValueObject } from '../value-object';
import { IRepository, ISearchableRepository } from './repository.interface';
import { SearchParams, SearchResult, SortDirection } from './search-params';
import { IUnitOfWork } from './unit-of-work.interface';

export abstract class InMemoryRepository<
  A extends AggregateRoot,
  ID extends ValueObject,
> implements IRepository<A, ID>
{
  items: A[] = [];

  constructor(private uow: IUnitOfWork) {}

  async insert(entity: A): Promise<void> {
    this.items.push(entity);
    this.uow.addAggregateRoot(entity);
  }

  async bulkInsert(entities: A[]): Promise<void> {
    this.items.push(...entities);
    entities.forEach((entity) => this.uow.addAggregateRoot(entity));
  }

  async findById(entityId: ID): Promise<A> {
    return this._get(entityId);
  }

  async findAll(): Promise<A[]> {
    return this.items;
  }

  async findByIds(ids: ID[]): Promise<A[]> {
    //avoid to return repeated items
    return this.items.filter((entity) => {
      return ids.some((id) => entity.entity_id.equals(id));
    });
  }

  async existsById(ids: ID[]): Promise<{ exists: ID[]; not_exists: ID[] }> {
    if (!ids.length) {
      throw new InvalidArgumentError(
        'ids must be an array with at least one element',
      );
    }

    if (this.items.length === 0) {
      return {
        exists: [],
        not_exists: ids,
      };
    }

    const existsId = new Set<ID>();
    const notExistsId = new Set<ID>();
    ids.forEach((id) => {
      const item = this.items.find((entity) => entity.entity_id.equals(id));
      item ? existsId.add(id) : notExistsId.add(id);
    });
    return {
      exists: Array.from(existsId.values()),
      not_exists: Array.from(notExistsId.values()),
    };
  }

  async update(entity: A): Promise<void> {
    const hasFound = await this._get(entity.entity_id as ID);
    if (!hasFound) {
      throw new NotFoundError(entity.entity_id, this.getEntity());
    }
    const indexFound = this.items.findIndex((i) =>
      i.entity_id.equals(entity.entity_id),
    );
    this.items[indexFound] = entity;
    this.uow.addAggregateRoot(entity);
  }

  async delete(id: ID): Promise<void> {
    await this._get(id);
    const indexFound = this.items.findIndex((i) => i.entity_id.equals(id));
    if (indexFound < 0) {
      throw new NotFoundError(id, this.getEntity());
    }
    this.items.splice(indexFound, 1);
  }

  protected async _get(id: ID): Promise<A> {
    const item = this.items.find((i) => i.entity_id.equals(id));
    return typeof item === 'undefined' ? null : item;
  }

  abstract getEntity(): new (...args: any[]) => A;
}

export abstract class InMemorySearchableRepository<
    A extends AggregateRoot,
    AggregateId extends ValueObject,
    Filter = string,
  >
  extends InMemoryRepository<A, AggregateId>
  implements ISearchableRepository<A, AggregateId, Filter>
{
  sortableFields: string[] = [];

  async search(props: SearchParams<Filter>): Promise<SearchResult<A>> {
    const itemsFiltered = await this.applyFilter(this.items, props.filter);
    const itemsSorted = await this.applySort(
      itemsFiltered,
      props.sort,
      props.sort_dir,
    );
    const itemsPaginated = await this.applyPaginate(
      itemsSorted,
      props.page,
      props.per_page,
    );
    return new SearchResult({
      items: itemsPaginated,
      total: itemsFiltered.length,
      current_page: props.page,
      per_page: props.per_page,
    });
  }

  protected abstract applyFilter(
    items: A[],
    filter: Filter | null,
  ): Promise<A[]>;

  protected async applySort(
    items: A[],
    sort: string | null,
    sort_dir: SortDirection | null,
    custom_getter?: (sort: string, item: A) => any,
  ): Promise<A[]> {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    return [...items].sort((a, b) => {
      const aValue = custom_getter ? custom_getter(sort, a) : a[sort];
      const bValue = custom_getter ? custom_getter(sort, b) : b[sort];
      if (aValue < bValue) {
        return sort_dir === 'asc' ? -1 : 1;
      }

      if (aValue > bValue) {
        return sort_dir === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  protected async applyPaginate(
    items: A[],
    page: SearchParams['page'],
    per_page: SearchParams['per_page'],
  ): Promise<A[]> {
    const start = (page - 1) * per_page; // 1 * 15 = 15
    const limit = start + per_page; // 15 + 15 = 30
    return items.slice(start, limit);
  }
}
