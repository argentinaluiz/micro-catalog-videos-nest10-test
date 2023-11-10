import { IIntegrationEvent } from '../../domain/events/integration-event.interface';
import { IMessageBusService } from '../message-bus.interface';

export class PublishIntegrationEventsHandler {
  constructor(private readonly messageBus: IMessageBusService) {}

  async handle(event: IIntegrationEvent): Promise<void> {
    await this.messageBus.publish(event);
  }
}
