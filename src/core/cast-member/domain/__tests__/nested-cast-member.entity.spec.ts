import { CastMemberType } from '../cast-member-type.vo';
import { CastMemberId } from '../cast-member.aggregate';
import { NestedCastMember } from '../nested-cast-member.entity';

describe('NestedCastMember Without Validator Unit Tests', () => {
  test('constructor of nested cast member', () => {
    const cast_member_id = new CastMemberId();
    const name = 'cast member test';
    const type = CastMemberType.createAnActor();
    const deleted_at = new Date();
    const nestedCastMember = new NestedCastMember({
      cast_member_id,
      name,
      type,
      deleted_at,
    });
    expect(nestedCastMember.cast_member_id).toBe(cast_member_id);
    expect(nestedCastMember.name).toBe(name);
    expect(nestedCastMember.type).toBe(type);
    expect(nestedCastMember.deleted_at).toBe(deleted_at);
  });
  describe('create command', () => {
    test('should create a nested cast member', () => {
      const cast_member_id = new CastMemberId();
      const name = 'cast member test';
      const type = CastMemberType.createAnActor();
      const nestedCastMember = NestedCastMember.create({
        cast_member_id,
        name,
        type,
      });
      expect(nestedCastMember.cast_member_id).toBe(cast_member_id);
      expect(nestedCastMember.name).toBe(name);
      expect(nestedCastMember.type).toBe(type);
      expect(nestedCastMember.deleted_at).toBe(null);
    });
  });

  test('should change name', () => {
    const nestedCastMember = new NestedCastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      deleted_at: new Date(),
    });
    nestedCastMember.changeName('other name');
    expect(nestedCastMember.name).toBe('other name');
  });

  test('should change type', () => {
    const nestedCastMember = new NestedCastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      deleted_at: new Date(),
    });
    nestedCastMember.changeType(CastMemberType.createADirector());
    expect(nestedCastMember.type).toEqual(CastMemberType.createADirector());
  });

  test('should mark as deleted', () => {
    const nestedCastMember = new NestedCastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      deleted_at: null,
    });
    nestedCastMember.markAsDeleted();
    expect(nestedCastMember.deleted_at).not.toBeNull();
  });

  test('should mark as not deleted', () => {
    const nestedCastMember = new NestedCastMember({
      cast_member_id: new CastMemberId(),
      name: 'cast member test',
      type: CastMemberType.createAnActor(),
      deleted_at: new Date(),
    });
    nestedCastMember.markAsNotDeleted();
    expect(nestedCastMember.deleted_at).toBe(null);
  });
});

describe('NestedCastMember Validator', () => {
  describe('create command', () => {
    test('should an invalid cast member with name property', () => {
      const castMember = NestedCastMember.create({
        cast_member_id: new CastMemberId(),
        name: 't'.repeat(256),
        type: CastMemberType.createAnActor(),
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
      const castMember = NestedCastMember.create({
        cast_member_id: new CastMemberId(),
        name: 'cast member test',
        type: CastMemberType.createAnActor(),
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
