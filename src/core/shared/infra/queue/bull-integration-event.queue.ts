import { Queue } from 'bull';
import { IIntegrationEventQueueService } from '../../application/queue.interface';
import { IIntegrationEvent } from '../../domain/events/integration-event.interface';

export class BullIntegrationEventQueue
  implements IIntegrationEventQueueService
{
  constructor(private queue: Queue) {}

  async add(event: IIntegrationEvent) {
    await this.queue.add(event);
  }
}
