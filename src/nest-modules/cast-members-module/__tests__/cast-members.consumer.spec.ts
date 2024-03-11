import { DeleteCastMemberUseCase } from '../../../core/cast-member/application/use-cases/delete-cast-member/delete-cast-member.use-case';
import { SaveCastMemberUseCase } from '../../../core/cast-member/application/use-cases/save-cast-member/save-cast-member.use-case';
import { CastMembersConsumer } from '../cast-members.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { CDCOperation } from '../../kafka-module/cdc.dto';
import { UnprocessableEntityException } from '@nestjs/common';
import { CastMemberTypes } from '../../../core/cast-member/domain/cast-member-type.vo';

describe('CastMembersConsumer Unit Tests', () => {
  let castMembersConsumer: CastMembersConsumer;
  let saveCastMemberUseCase: SaveCastMemberUseCase;
  let deleteCastMemberUseCase: DeleteCastMemberUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CastMembersConsumer],
      providers: [SaveCastMemberUseCase, DeleteCastMemberUseCase],
    })
      .overrideProvider(SaveCastMemberUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .overrideProvider(DeleteCastMemberUseCase)
      .useValue({
        execute: jest.fn(),
      })
      .compile();

    castMembersConsumer = module.get<CastMembersConsumer>(CastMembersConsumer);
    saveCastMemberUseCase = module.get<SaveCastMemberUseCase>(
      SaveCastMemberUseCase,
    );
    deleteCastMemberUseCase = module.get<DeleteCastMemberUseCase>(
      DeleteCastMemberUseCase,
    );
  });

  describe('handle', () => {
    it('should log a message when the event is a read event', async () => {
      const loggerSpy = jest.spyOn(castMembersConsumer['logger'], 'log');
      const message = {
        op: 'r',
      } as any;

      await castMembersConsumer.handle(message);

      expect(loggerSpy).toHaveBeenCalledWith(
        '[INFO] [CastMembersConsumer] - Discarding read event',
      );
    });

    describe('should call saveUseCase.execute when the event is a create or update event', () => {
      const repeatedProps = {
        id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
        name: 'cast member test',
        type: CastMemberTypes.ACTOR,
        created_at: new Date(),
      };
      const arrange = [
        {
          op: CDCOperation.CREATE,
          before: null,
          after: repeatedProps,
        },
        {
          op: CDCOperation.CREATE,
          before: null,
          after: {
            ...repeatedProps,
            type: CastMemberTypes.DIRECTOR,
          },
        },
        {
          op: CDCOperation.UPDATE,
          before: {
            id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
            name: 'cast member test',
            type: CastMemberTypes.ACTOR,
            created_at: new Date(),
          },
          after: {
            id: '6e8e2e8e-4b6e-4f3e-8f3c-3f3e8e3e8e3e',
            name: 'cast member test updated',
            type: CastMemberTypes.DIRECTOR,
            created_at: new Date(),
          },
        },
      ];

      it.each(arrange)('message: %j', async (message) => {
        const saveUseCaseSpy = jest.spyOn(saveCastMemberUseCase, 'execute');

        await castMembersConsumer.handle(message);

        expect(saveUseCaseSpy).toHaveBeenCalledWith({
          cast_member_id: message.after.id,
          name: message.after.name,
          type: message.after.type,
          created_at:
            message.after.created_at instanceof Date
              ? message.after.created_at
              : new Date(message.after.created_at),
        });
      });
    });

    it('should call deleteUseCase.execute when the event is a delete event', async () => {
      const deleteUseCaseSpy = jest.spyOn(deleteCastMemberUseCase, 'execute');
      const message = {
        op: CDCOperation.DELETE,
        before: {
          id: 1,
        },
        after: null,
      };

      await castMembersConsumer.handle(message);

      expect(deleteUseCaseSpy).toHaveBeenCalledWith(1);
    });

    describe('should throw an error when the event is not a valid operation', () => {
      const repeatedErrors = [
        'name should not be empty',
        'name must be a string',
        'type should not be empty',
        'type must be an integer number',
        'created_at must be a Date instance or a valid date string',
      ];
      const arrange = [
        {
          message: {
            op: CDCOperation.CREATE,
            after: null,
          },
          expectedErrors: repeatedErrors,
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {},
          },
          expectedErrors: repeatedErrors,
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              id: 1,
            },
          },
          expectedErrors: [
            'cast_member_id must be a string',
            'cast_member_id must be a UUID',
            ...repeatedErrors,
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              name: 1,
            },
          },
          expectedErrors: [
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              name: 1,
            },
          },
          expectedErrors: [
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              type: 'invalid',
            },
          },
          expectedErrors: [
            'cast_member_id should not be empty',
            'cast_member_id must be a string',
            'cast_member_id must be a UUID',
            'name should not be empty',
            'name must be a string',
            'type must be an integer number',
            'created_at must be a Date instance or a valid date string',
          ],
        },
        {
          message: {
            op: CDCOperation.CREATE,
            after: {
              created_at: 'a',
            },
          },
          expectedErrors: [
            'name should not be empty',
            'name must be a string',
            'created_at must be a Date instance or a valid date string',
          ],
        },
      ];

      it.each(arrange)('message: %j', async ({ message, expectedErrors }) => {
        try {
          await castMembersConsumer.handle(message as any);
        } catch (e) {
          const error: UnprocessableEntityException = e;
          expect(e).toBeInstanceOf(UnprocessableEntityException);
          expect(error.getStatus()).toBe(422);
          //@ts-expect-error error.getResponse() is an object
          expect(error.getResponse().message).toMatchObject(
            expect.arrayContaining(expectedErrors),
          );
        }
      });
    });
  });
});
