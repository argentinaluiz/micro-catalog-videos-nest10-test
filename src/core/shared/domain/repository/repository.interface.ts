import { AggregateRoot } from '../aggregate-root';
import { ValueObject } from '../value-object';
import { SearchParams, SearchResult } from './search-params';

export interface IRepository<A extends AggregateRoot, ID extends ValueObject> {
  insert(entity: A): Promise<void>;
  bulkInsert(entities: A[]): Promise<void>;
  findById(id: ID): Promise<A>;
  findAll(): Promise<A[]>;
  findByIds(ids: ID[]): Promise<A[]>;
  existsById(ids: ID[]): Promise<{
    exists: ID[];
    not_exists: ID[];
  }>;
  update(entity: A): Promise<void>;
  delete(id: ID): Promise<void>;
  getEntity(): new (...args: any[]) => A;
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
