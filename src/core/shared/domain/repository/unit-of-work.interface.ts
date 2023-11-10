import { AggregateRoot } from '../aggregate-root';

export interface IUnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  addAggregateRoot(aggregateRoot: AggregateRoot): void;
  getAggregateRoots(): AggregateRoot[];
  do<T>(workFn: (uow: IUnitOfWork) => Promise<T>): Promise<T>;
  getTransaction(): any;
}
