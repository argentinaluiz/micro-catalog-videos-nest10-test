import EventEmitter2 from 'eventemitter2';
import { DomainEventManager } from '../../domain/events/domain-event-manager';
import { IUnitOfWork } from '../../domain/repository/unit-of-work.interface';
import { UnitOfWorkFakeInMemory } from '../../infra/db/in-memory/fake-unit-work-in-memory';
import { ApplicationService } from '../application.service';
import { AggregateRoot } from '../../domain/aggregate-root';
import { ValueObject } from '../../domain/value-object';

class StubAggregate extends AggregateRoot {
  get entity_id(): ValueObject {
    throw new Error('Method not implemented.');
  }
  toJSON() {
    throw new Error('Method not implemented.');
  }
}

describe('ApplicationService Unit Of Work', () => {
  let uow: IUnitOfWork;
  let domainEventManager: DomainEventManager;
  let service: ApplicationService;

  beforeEach(() => {
    uow = new UnitOfWorkFakeInMemory();
    const eventEmitter = new EventEmitter2();
    domainEventManager = new DomainEventManager(eventEmitter);
    service = new ApplicationService(uow, domainEventManager);
  });

  describe('start', () => {
    it('should call the start method of the unit of work', () => {
      const startSpy = jest.spyOn(uow, 'start');
      service.start();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('finish', () => {
    it('should publish domain events and commit the unit of work', async () => {
      const aggregateRoot = new StubAggregate();
      uow.addAggregateRoot(aggregateRoot as any);
      const spyPublish = jest.spyOn(domainEventManager, 'publish');
      const spyPublishForIntegrationEvent = jest.spyOn(
        domainEventManager,
        'publishForIntegrationEvent',
      );
      const spyCommit = jest.spyOn(uow, 'commit');
      await service.finish();

      expect(spyPublish).toHaveBeenCalledWith(aggregateRoot);
      expect(spyCommit).toHaveBeenCalled();
      expect(spyPublishForIntegrationEvent).toHaveBeenCalledWith(aggregateRoot);
    });
  });

  describe('fail', () => {
    it('should rollback the unit of work', () => {
      const spyRollback = jest.spyOn(uow, 'rollback');
      service.fail();
      expect(spyRollback).toHaveBeenCalled();
    });
  });

  describe('run', () => {
    it('should start, execute the callback, finish and return the result', async () => {
      const callback = jest.fn().mockResolvedValue('test-result');
      const spyStart = jest.spyOn(service, 'start');
      const spyFinish = jest.spyOn(service, 'finish');
      const result = await service.run(callback);

      expect(spyStart).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
      expect(spyFinish).toHaveBeenCalled();
      expect(result).toEqual('test-result');
    });

    it('should rollback the unit of work and rethrow the error if the callback throws an error', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('test-error'));
      const spyFail = jest.spyOn(service, 'fail');
      await expect(service.run(callback)).rejects.toThrowError('test-error');

      expect(spyFail).toHaveBeenCalled();
    });
  });
});
