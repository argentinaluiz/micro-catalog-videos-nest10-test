import EventEmitter2 from 'eventemitter2';
import { IDomainEvent } from './events/domain-event.interface';
import { Entity } from './entity';

export abstract class AggregateRoot extends Entity {
  events: Set<IDomainEvent> = new Set<IDomainEvent>();
  dispatchedEvents: Set<IDomainEvent> = new Set<IDomainEvent>();
  localMediator = new EventEmitter2({
    wildcard: true,
  });

  applyEvent(event: IDomainEvent) {
    this.events.add(event);
    this.localMediator.emit(event.constructor.name, event);
  }

  registerHandler(event: string, handler: (event: IDomainEvent) => void) {
    this.localMediator.on(event, handler);
  }

  markEventsAsDispatched(event: IDomainEvent) {
    this.dispatchedEvents.add(event);
  }

  getUncommittedEvents(): IDomainEvent[] {
    return Array.from(this.events).filter((event) => {
      return !this.dispatchedEvents.has(event);
    });
  }

  clearEvents() {
    this.events.clear();
    this.dispatchedEvents.clear();
  }
}
