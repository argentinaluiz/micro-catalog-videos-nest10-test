import { CastMemberType } from '../cast-member-type.vo';
import { CastMember, CastMemberId } from '../cast-member.aggregate';

describe('CastMember Without Validator Unit Tests', () => {
  beforeEach(() => {
    CastMember.prototype.validate = jest
      .fn()
      .mockImplementation(CastMember.prototype.validate);
  });
  test('constructor of cast member', () => {
    const cast_member_id = new CastMemberId();
    const name = 'cast member test';
    const type = CastMemberType.createAnActor();
    const created_at = new Date();
    const castMember = new CastMember({
      cast_member_id,
      name,
      type,
      created_at,
    });
    expect(castMember.cast_member_id).toBe(cast_member_id);
    expect(castMember.name).toBe(name);
    expect(castMember.type).toBe(type);
    expect(castMember.created_at).toBe(created_at);
  });

  describe('create command', () => {
    test('should create a cast member', () => {
      const cast_member_id = new CastMemberId();
      const name = 'cast member test';
      const type = CastMemberType.createAnActor();
      const created_at = new Date();
      const castMember = CastMember.create({
        cast_member_id,
        name,
        type,
        created_at,
      });
      expect(castMember.cast_member_id).toBe(cast_member_id);
      expect(castMember.name).toBe(name);
      expect(castMember.type).toBe(type);
      expect(castMember.created_at).toBe(created_at);
      expect(CastMember.prototype.validate).toHaveBeenCalledTimes(1);
      expect(castMember.notification.hasErrors()).toBe(false);
    });
  });

  test('should change name', () => {
    const castMember = new CastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      created_at: new Date(),
    });
    castMember.changeName('other name');
    expect(castMember.name).toBe('other name');
    expect(CastMember.prototype.validate).toHaveBeenCalledTimes(1);
    expect(castMember.notification.hasErrors()).toBe(false);
  });

  test('should change type', () => {
    const castMember = new CastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      created_at: new Date(),
    });
    castMember.changeType(CastMemberType.createADirector());
    expect(castMember.type).toEqual(CastMemberType.createADirector());
    expect(castMember.notification.hasErrors()).toBe(false);
  });

  test('should mark as deleted', () => {
    const castMember = new CastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      created_at: new Date(),
    });
    castMember.markAsDeleted();
    expect(castMember.deleted_at).not.toBeNull();
    expect(castMember.notification.hasErrors()).toBe(false);
  });

  test('should mark as not deleted', () => {
    const castMember = new CastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      created_at: new Date(),
      deleted_at: new Date(),
    });
    castMember.markAsNotDeleted();
    expect(castMember.deleted_at).toBeNull();
    expect(castMember.notification.hasErrors()).toBe(false);
  });
});

describe('CastMember Validator', () => {
  describe('create command', () => {
    test('should an invalid cast member with name property', () => {
      const castMember = CastMember.create({
        cast_member_id: new CastMemberId(),
        name: 't'.repeat(256),
        type: CastMemberType.createAnActor(),
        created_at: new Date(),
      });

      expect(castMember.notification.hasErrors()).toBe(true);
      expect(castMember.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });

  describe('changeName method', () => {
    it('should a invalid cast member using name property', () => {
      const castMember = CastMember.create({
        cast_member_id: new CastMemberId(),
        name: 'cast member test',
        type: CastMemberType.createAnActor(),
        created_at: new Date(),
      });
      castMember.changeName('t'.repeat(256));
      expect(castMember.notification.hasErrors()).toBe(true);
      expect(castMember.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
