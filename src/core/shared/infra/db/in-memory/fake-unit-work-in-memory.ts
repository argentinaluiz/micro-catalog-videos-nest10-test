import { AggregateRoot } from '../../../domain/aggregate-root';
import { IUnitOfWork } from '../../../domain/repository/unit-of-work.interface';

export class UnitOfWorkFakeInMemory implements IUnitOfWork {
  private aggregateRoots: Set<AggregateRoot> = new Set();

  constructor() {}

  getAggregateRoots(): AggregateRoot[] {
    return [...this.aggregateRoots];
  }

  addAggregateRoot(aggregateRoot: AggregateRoot): void {
    this.aggregateRoots.add(aggregateRoot);
  }

  start(): Promise<void> {
    return;
  }
  commit(): Promise<void> {
    return;
  }
  rollback(): Promise<void> {
    return;
  }
  do<T>(workFn: (uow: IUnitOfWork) => Promise<T>): Promise<T> {
    return workFn(this);
  }

  getTransaction() {
    return;
  }
}
