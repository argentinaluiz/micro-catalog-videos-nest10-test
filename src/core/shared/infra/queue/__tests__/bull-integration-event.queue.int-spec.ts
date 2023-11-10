import Queue, { Queue as QueueType } from 'bull';
import { IIntegrationEvent } from '../../../domain/events/integration-event.interface';
import { BullIntegrationEventQueue } from '../bull-integration-event.queue';
import { Config } from '../../config';

describe('BullIntegrationEventQueue', () => {
  let queueService: BullIntegrationEventQueue;
  let integrationQueue: QueueType;
  beforeEach(async () => {
    integrationQueue = new Queue('integration-events', Config.redisUrl());
    await integrationQueue.clean(0, 'wait');
    queueService = new BullIntegrationEventQueue(integrationQueue);
  });

  afterEach(async () => {
    await integrationQueue.close(true);
  });

  describe('add', () => {
    it('should add the integration event to the queue', async () => {
      const integrationEvent: IIntegrationEvent = {
        event_name: 'test-id',
        payload: {
          test: 'test',
        },
        occurred_on: new Date(),
        event_version: 1,
      };

      await queueService.add(integrationEvent);
      const jobs = await integrationQueue.getJobs(['waiting']);
      expect(jobs.length).toBe(1);
      expect(jobs[0].data).toEqual({
        ...integrationEvent,
        occurred_on: integrationEvent.occurred_on.toISOString(),
      });
      await integrationQueue.clean(0, 'wait');
    });
  });
});
