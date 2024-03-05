import { AggregateRoot } from '../aggregate-root';
import { InvalidArgumentError } from '../errors/invalid-argument.error';
import { NotFoundError } from '../errors/not-found.error';
import { ValueObject } from '../value-object';
import { IRepository, ISearchableRepository } from './repository.interface';
import { SearchParams, SortDirection } from './search-params';
import { SearchResult } from './search-result';

export abstract class InMemoryRepository<
  E extends AggregateRoot,
  ID extends ValueObject,
> implements IRepository<E, ID>
{
  items: E[] = [];

  constructor() {}

  async insert(entity: E): Promise<void> {
    this.items.push(entity);
  }

  async bulkInsert(entities: E[]): Promise<void> {
    this.items.push(...entities);
  }

  async findById(entityId: ID): Promise<E | null> {
    return this._get(entityId);
  }

  async findAll(): Promise<E[]> {
    return this.items.filter((entity) => !this.isDeleted(entity));
  }

  async findByIds(ids: ID[]): Promise<E[]> {
    //avoid to return repeated items
    return this.items.filter((entity) => {
      return (
        !this.isDeleted(entity) && ids.some((id) => entity.entity_id.equals(id))
      );
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
      const item = this.items.find(
        (entity) => !this.isDeleted(entity) && entity.entity_id.equals(id),
      );
      item ? existsId.add(id) : notExistsId.add(id);
    });
    return {
      exists: Array.from(existsId.values()),
      not_exists: Array.from(notExistsId.values()),
    };
  }

  async update(entity: E): Promise<void> {
    const hasFound = await this._get(entity.entity_id as ID);
    if (!hasFound) {
      throw new NotFoundError(entity.entity_id, this.getEntity());
    }
    const indexFound = this.items.findIndex((i) =>
      i.entity_id.equals(entity.entity_id),
    );
    this.items[indexFound] = entity;
  }

  async delete(id: ID): Promise<void> {
    await this._get(id);
    const indexFound = this.items.findIndex(
      (i) => !this.isDeleted(i) && i.entity_id.equals(id),
    );
    if (indexFound < 0) {
      throw new NotFoundError(id, this.getEntity());
    }
    if ('deleted_at' in this.items[indexFound]) {
      //@ts-expect-error entity can have a deleted_at property
      this.items[indexFound].deleted_at = new Date();
    } else {
      this.items.splice(indexFound, 1);
    }
  }

  protected async _get(id: ID): Promise<E | null> {
    const item = this.items.find(
      (i) => !this.isDeleted(i) && i.entity_id.equals(id),
    );
    return typeof item === 'undefined' ? null : item;
  }

  protected isDeleted(entity: E): boolean {
    return 'deleted_at' in entity ? entity.deleted_at !== null : false;
  }

  abstract getEntity(): new (...args: any[]) => E;
}

export abstract class InMemorySearchableRepository<
    E extends AggregateRoot,
    AggregateId extends ValueObject,
    Filter = string,
  >
  extends InMemoryRepository<E, AggregateId>
  implements ISearchableRepository<E, AggregateId, Filter>
{
  sortableFields: string[] = [];

  async search(props: SearchParams<Filter>): Promise<SearchResult<E>> {
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
    items: E[],
    filter: Filter | null,
  ): Promise<E[]>;

  protected async applySort(
    items: E[],
    sort: string | null,
    sort_dir: SortDirection | null,
    custom_getter?: (sort: string, item: E) => any,
  ): Promise<E[]> {
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
    items: E[],
    page: SearchParams['page'],
    per_page: SearchParams['per_page'],
  ): Promise<E[]> {
    const start = (page - 1) * per_page; // 1 * 15 = 15
    const limit = start + per_page; // 15 + 15 = 30
    return items.slice(start, limit);
  }
}
