import { IIntegrationEventQueueService } from '../../application/queue.interface';
import { IIntegrationEvent } from '../../domain/events/integration-event.interface';

export class InMemoryIntegrationEventQueue
  implements IIntegrationEventQueueService
{
  private queue: any[] = [];

  async add(event: IIntegrationEvent) {
    this.queue.push(event);
  }
}
