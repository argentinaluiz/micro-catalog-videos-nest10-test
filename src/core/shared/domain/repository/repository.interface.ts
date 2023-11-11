import { AggregateRoot } from '../aggregate-root';
import { ValueObject } from '../value-object';
import { SearchParams, SearchResult } from './search-params';

export interface IRepository<E extends AggregateRoot, ID extends ValueObject> {
  insert(entity: E): Promise<void>;
  bulkInsert(entities: E[]): Promise<void>;
  findById(id: ID): Promise<E | null>;
  findAll(): Promise<E[]>;
  findByIds(ids: ID[]): Promise<E[]>;
  existsById(ids: ID[]): Promise<{
    exists: ID[];
    not_exists: ID[];
  }>;
  update(entity: E): Promise<void>;
  delete(id: ID): Promise<void>;
  getEntity(): new (...args: any[]) => E;
}

//category.props.name

//Entidade e Objetos

export interface ISearchableRepository<
  A extends AggregateRoot,
  AggregateId extends ValueObject,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult<A>,
> extends IRepository<A, AggregateId> {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
}
