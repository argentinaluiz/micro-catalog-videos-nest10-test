import { IIntegrationEvent } from '../domain/events/integration-event.interface';

export interface IMessageBusService {
  publish: (data: IIntegrationEvent) => Promise<void>;
}
