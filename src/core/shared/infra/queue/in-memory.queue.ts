import { IQueueService } from '../../application/queue.interface';

export class InMemoryQueue implements IQueueService {
  private queue: any[] = [];

  async add(data: any) {
    this.queue.push(data);
  }
}
