import { DomainEventManager } from '../domain/events/domain-event-manager';

export class ApplicationService {
  constructor(
    //private mediator: Mediator,
    private domainEventManager: DomainEventManager,
  ) {}

  start() {
    //this.uow.start();
  }

  async finish() {
    // const aggregateRoots = [...this.uow.getAggregateRoots()];
    // for (const aggregateRoot of aggregateRoots) {
    //   await this.domainEventManager.publish(aggregateRoot);
    // }
    // await this.uow.commit();
    // for (const aggregateRoot of aggregateRoots) {
    //   await this.domainEventManager.publishForIntegrationEvent(aggregateRoot);
    // }
  }

  fail() {
    //this.uow.rollback();
  }

  async run<T>(callback: () => Promise<T>): Promise<T> {
    await this.start();
    try {
      const result = await callback();
      await this.finish();
      return result;
    } catch (e) {
      await this.fail();
      throw e;
    }
  }
}
