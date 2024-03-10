import { DeleteGenreUseCase } from '../../../core/genre/application/use-cases/delete-genre/delete-genre.use-case';
import { SaveGenreUseCase } from '../../../core/genre/application/use-cases/save-genre/save-genre.use-case';
import { GenresConsumer } from '../genres.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { CDCOperation } from '../../kafka-module/cdc.dto';

describe('GenresConsumer Unit Tests', () => {
  let genresConsumer: GenresConsumer;
  let saveGenreUseCase: SaveGenreUseCase;
  let deleteGenreUseCase: DeleteGenreUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresConsumer],
      providers: [SaveGenreUseCase, DeleteGenreUseCase],
    })
      .overrideProvider(SaveGenreUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(DeleteGenreUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .compile();

    genresConsumer = module.get<GenresConsumer>(GenresConsumer);
    saveGenreUseCase = module.get<SaveGenreUseCase>(SaveGenreUseCase);
    deleteGenreUseCase = module.get<DeleteGenreUseCase>(DeleteGenreUseCase);
  });

  describe('handleKConnectEvents', () => {
    it('should log a message when the event is a read event', async () => {
      const loggerSpy = jest.spyOn(genresConsumer['logger'], 'log');
      const message = {
        op: 'r',
      } as any;

      await genresConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [GenresConsumer] - Discarding read event',
      );
    });

    it('should log a message when the event is a create event', async () => {
      const loggerSpy = jest.spyOn(genresConsumer['logger'], 'log');
      const message = {
        op: 'c',
      } as any;

      await genresConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [GenresConsumer] - Discarding create event',
      );
    });

    it('should log a message when the event is a create event', async () => {
      const loggerSpy = jest.spyOn(genresConsumer['logger'], 'log');
      const message = {
        op: 'u',
      } as any;

      await genresConsumer.handleKConnectEvents(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [GenresConsumer] - Discarding update event',
      );
    });

    it('should call deleteUseCase.execute when the event is a delete event', async () => {
      const deleteUseCaseSpy = jest.spyOn(deleteGenreUseCase, 'execute');
      const message = {
        op: CDCOperation.DELETE,
        before: {
          id: 1,
        },
        after: null,
      };

      await genresConsumer.handleKConnectEvents(message);

      expect(deleteUseCaseSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('handleCreateAndUpdateEvents', () => {
    it('should call saveUseCase.execute when the event is a create event', async () => {
      const saveUseCaseSpy = jest.spyOn(saveGenreUseCase, 'execute');
      const message = {
        op: CDCOperation.CREATE,
      } as any;

      await genresConsumer.handleCreateAndUpdateEvents(message);

      expect(saveUseCaseSpy).toHaveBeenCalled();
    });

    it('should call saveUseCase.execute when the event is an update event', async () => {
      const saveUseCaseSpy = jest.spyOn(saveGenreUseCase, 'execute');
      const message = {
        op: CDCOperation.UPDATE,
      } as any;

      await genresConsumer.handleCreateAndUpdateEvents(message);

      expect(saveUseCaseSpy).toHaveBeenCalled();
    });
  });
});
