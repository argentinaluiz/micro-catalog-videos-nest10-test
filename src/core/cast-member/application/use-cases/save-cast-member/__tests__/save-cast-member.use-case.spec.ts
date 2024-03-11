import { CastMemberTypes } from '../../../../domain/cast-member-type.vo';
import {
  CastMember,
  CastMemberId,
} from '../../../../domain/cast-member.aggregate';
import { CastMemberInMemoryRepository } from '../../../../infra/db/in-memory/cast-member-in-memory.repository';
import { SaveCastMemberInput } from '../save-cast-member.input';
import { SaveCastMemberUseCase } from '../save-cast-member.use-case';

describe('SaveCastMemberUseCase Unit Tests', () => {
  let useCase: SaveCastMemberUseCase;
  let repository: CastMemberInMemoryRepository;

  beforeEach(() => {
    repository = new CastMemberInMemoryRepository();
    useCase = new SaveCastMemberUseCase(repository);
  });

  it('should call createCastMember method when cast_member_id is not provided', async () => {
    useCase['createCastMember'] = jest.fn();
    const input = new SaveCastMemberInput({
      cast_member_id: new CastMemberId().id,
      name: 'test',
      type: CastMemberTypes.ACTOR,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['createCastMember']).toHaveBeenCalledTimes(1);
    expect(useCase['createCastMember']).toHaveBeenCalledWith(input);
  });

  it('should call updateCastMember method when cast_member_id is provided', async () => {
    useCase['updateCastMember'] = jest.fn();
    const castMember = CastMember.fake().anActor().build();
    repository.insert(castMember);
    const input = new SaveCastMemberInput({
      cast_member_id: castMember.cast_member_id.id,
      name: 'test',
      type: CastMemberTypes.DIRECTOR,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['updateCastMember']).toHaveBeenCalledTimes(1);
    expect(useCase['updateCastMember']).toHaveBeenCalledWith(
      input,
      expect.any(CastMember),
    );
  });

  describe('execute createCastMember method', () => {
    it('should throw an error when entity is not valid', async () => {
      const spyCreateCastMember = jest.spyOn(
        useCase,
        'createCastMember' as any,
      );
      const input = new SaveCastMemberInput({
        cast_member_id: new CastMemberId().id,
        name: 't'.repeat(256),
        type: CastMemberTypes.ACTOR,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
      expect(spyCreateCastMember).toHaveBeenCalledTimes(1);
    });

    it('should create a cast member', async () => {
      const spyInsert = jest.spyOn(repository, 'insert');
      const castMemberId = new CastMemberId().id;
      const input = new SaveCastMemberInput({
        cast_member_id: castMemberId,
        name: 'test',
        type: CastMemberTypes.ACTOR,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: castMemberId,
        created: true,
      });
    });
  });

  describe('execute calling updateCastMember method', () => {
    it('should throw an error when entity is not valid', async () => {
      const castMember = CastMember.fake().anActor().build();
      repository.items.push(castMember);
      const input = new SaveCastMemberInput({
        cast_member_id: castMember.cast_member_id.id,
        name: 't'.repeat(256),
        type: CastMemberTypes.DIRECTOR,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
    });

    it('should update a cast member', async () => {
      const spyUpdate = jest.spyOn(repository, 'update');
      const castMember = CastMember.fake().anActor().build();
      repository.items.push(castMember);
      const input = new SaveCastMemberInput({
        cast_member_id: castMember.cast_member_id.id,
        name: 'test',
        type: CastMemberTypes.DIRECTOR,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: repository.items[0].cast_member_id.id,
        created: false,
      });
    });
  });
});
