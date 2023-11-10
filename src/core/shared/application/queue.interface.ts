import { IIntegrationEvent } from '../domain/events/integration-event.interface';

export interface IQueueService {
  add: (data: any) => Promise<void>;
}

export interface IIntegrationEventQueueService {
  add: (data: IIntegrationEvent) => Promise<void>;
}
