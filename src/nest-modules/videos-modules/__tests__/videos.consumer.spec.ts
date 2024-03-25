import { DeleteVideoUseCase } from '../../../core/video/application/use-cases/delete-video/delete-video.use-case';
import { SaveVideoUseCase } from '../../../core/video/application/use-cases/save-video/save-video.use-case';
import { VideosConsumer } from '../videos.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { CDCOperation } from '../../kafka-module/cdc.dto';

describe('VideosConsumer Unit Tests', () => {
  let videosConsumer: VideosConsumer;
  let saveVideoUseCase: SaveVideoUseCase;
  let deleteVideoUseCase: DeleteVideoUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosConsumer],
      providers: [SaveVideoUseCase, DeleteVideoUseCase],
    })
      .overrideProvider(SaveVideoUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(DeleteVideoUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .compile();

    videosConsumer = module.get<VideosConsumer>(VideosConsumer);
    saveVideoUseCase = module.get<SaveVideoUseCase>(SaveVideoUseCase);
    deleteVideoUseCase = module.get<DeleteVideoUseCase>(DeleteVideoUseCase);
  });

  describe('handleKConnectEvents', () => {
    it('should log a message when the event is a read event', async () => {
      const loggerSpy = jest.spyOn(videosConsumer['logger'], 'log');
      const message = {
        op: 'r',
      } as any;

      await videosConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [VideosConsumer] - Discarding read event',
      );
    });

    it('should log a message when the event is a create event', async () => {
      const loggerSpy = jest.spyOn(videosConsumer['logger'], 'log');
      const message = {
        op: 'c',
      } as any;

      await videosConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [VideosConsumer] - Discarding create event',
      );
    });

    it('should log a message when the event is a create event', async () => {
      const loggerSpy = jest.spyOn(videosConsumer['logger'], 'log');
      const message = {
        op: 'u',
      } as any;

      await videosConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [VideosConsumer] - Discarding update event',
      );
    });

    it('should call deleteUseCase.execute when the event is a delete event', async () => {
      const deleteUseCaseSpy = jest.spyOn(deleteVideoUseCase, 'execute');
      const message = {
        op: CDCOperation.DELETE,
        before: {
          id: 1,
        },
        after: null,
      };

      await videosConsumer.handleKConnectEvents(message);

      expect(deleteUseCaseSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('handleCreateAndUpdateEvents', () => {
    it('should call saveUseCase.execute when the event is a create event', async () => {
      const saveUseCaseSpy = jest.spyOn(saveVideoUseCase, 'execute');
      const message = {
        op: CDCOperation.CREATE,
      } as any;

      await videosConsumer.handleCreateAndUpdateEvents(message);

      expect(saveUseCaseSpy).toHaveBeenCalled();
    });

    it('should call saveUseCase.execute when the event is an update event', async () => {
      const saveUseCaseSpy = jest.spyOn(saveVideoUseCase, 'execute');
      const message = {
        op: CDCOperation.UPDATE,
      } as any;

      await videosConsumer.handleCreateAndUpdateEvents(message);

      expect(saveUseCaseSpy).toHaveBeenCalled();
    });
  });
});
