import EventEmitter2 from 'eventemitter2';
import { AggregateRoot } from '../aggregate-root';

export class DomainEventManager {
  constructor(private eventEmitter: EventEmitter2) {}

  register(event: string, handler: any) {
    this.eventEmitter.on(event, handler);
  }

  registerForIntegrationEvent(event: string, handler: any) {
    this.eventEmitter.on(`Integration${event}`, handler);
  }

  async publish(aggregateRoot: AggregateRoot) {
    for (const event of aggregateRoot.getUncommittedEvents()) {
      const eventClassName = event.constructor.name;
      aggregateRoot.markEventsAsDispatched(event);
      await this.eventEmitter.emitAsync(eventClassName, event);
    }
  }

  async publishForIntegrationEvent(aggregateRoot: AggregateRoot) {
    for (const event of aggregateRoot.events) {
      const eventClassName = event.constructor.name;
      await this.eventEmitter.emitAsync(`Integration${eventClassName}`, event);
    }
  }
}
