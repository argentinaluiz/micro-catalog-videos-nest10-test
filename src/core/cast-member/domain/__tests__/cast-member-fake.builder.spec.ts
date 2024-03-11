import { Chance } from 'chance';
import { CastMemberFakeBuilder } from '../cast-member-fake.builder';
import { CastMemberId } from '../cast-member.aggregate';
import { CastMemberType } from '../cast-member-type.vo';

describe('CastMemberFakerBuilder Unit Tests', () => {
  describe('cast_member_id prop', () => {
    const faker = CastMemberFakeBuilder.anActor();

    test('should be a function', () => {
      expect(typeof faker['_cast_member_id']).toBe('function');
    });

    test('should return a CastMemberId instance', () => {
      //@ts-expect-error _cast_member_id is a callable
      const cast_member_id = faker['_cast_member_id']();
      expect(cast_member_id).toBeInstanceOf(CastMemberId);
    });

    test('withCastMemberId', () => {
      const cast_member_id = new CastMemberId();
      const $this = faker.withCastMemberId(cast_member_id);
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_cast_member_id']).toBe(cast_member_id);

      faker.withCastMemberId(() => cast_member_id);
      //@ts-expect-error _cast_member_id is a callable
      expect(faker['_cast_member_id']()).toBe(cast_member_id);

      expect(faker.cast_member_id).toBe(cast_member_id);
    });

    test('should pass index to cast_member_id factory', () => {
      let mockFactory = jest.fn(() => new CastMemberId());
      faker.withCastMemberId(mockFactory);
      faker.build();
      expect(mockFactory).toHaveBeenCalledTimes(1);

      const castMemberId = new CastMemberId();
      mockFactory = jest.fn(() => castMemberId);
      const fakerMany = CastMemberFakeBuilder.theCastMembers(2);
      fakerMany.withCastMemberId(mockFactory);
      fakerMany.build();

      expect(mockFactory).toHaveBeenCalledTimes(2);
      expect(fakerMany.build()[0].cast_member_id).toBe(castMemberId);
      expect(fakerMany.build()[1].cast_member_id).toBe(castMemberId);
    });
  });

  describe('name prop', () => {
    const faker = CastMemberFakeBuilder.anActor();
    test('should be a function', () => {
      expect(typeof faker['_name']).toBe('function');
    });

    test('should call the word method', () => {
      const chance = Chance();
      const spyWordMethod = jest.spyOn(chance, 'word');
      faker['chance'] = chance;
      faker.build();

      expect(spyWordMethod).toHaveBeenCalled();
    });

    test('withName', () => {
      const $this = faker.withName('test name');
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_name']).toBe('test name');

      faker.withName(() => 'test name');
      //@ts-expect-error name is callable
      expect(faker['_name']()).toBe('test name');

      expect(faker.name).toBe('test name');
    });

    test('should pass index to name factory', () => {
      faker.withName((index) => `test name ${index}`);
      const castMember = faker.build();
      expect(castMember.name).toBe(`test name 0`);

      const fakerMany = CastMemberFakeBuilder.theCastMembers(2);
      fakerMany.withName((index) => `test name ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].name).toBe(`test name 0`);
      expect(categories[1].name).toBe(`test name 1`);
    });

    test('invalid too long case', () => {
      const $this = faker.withInvalidNameTooLong();
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_name'].length).toBe(256);

      const tooLong = 'a'.repeat(256);
      faker.withInvalidNameTooLong(tooLong);
      expect(faker['_name'].length).toBe(256);
      expect(faker['_name']).toBe(tooLong);
    });
  });

  describe('type prop', () => {
    const faker = CastMemberFakeBuilder.anActor();
    it('should be a CastMemberType', () => {
      expect(faker['_type']).toBeInstanceOf(CastMemberType);
    });

    test('withType', () => {
      const type = CastMemberType.createAnActor();
      const $this = faker.withType(type);
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_type']).toBe(type);

      faker.withType(() => type);
      //@ts-expect-error _type is a callable
      expect(faker['_type']()).toBe(type);
      expect(faker.type).toBe(type);
    });
  });

  describe('created_at prop', () => {
    const faker = CastMemberFakeBuilder.anActor();

    test('should be a function', () => {
      expect(typeof faker['_created_at']).toBe('function');
    });

    test('should return a Date instance', () => {
      //@ts-expect-error _created_at is a callable
      const created_at = faker['_created_at']();
      expect(created_at).toBeInstanceOf(Date);
    });

    test('withCreatedAt', () => {
      const date = new Date();
      const $this = faker.withCreatedAt(date);
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_created_at']).toBe(date);

      faker.withCreatedAt(() => date);
      //@ts-expect-error _created_at is a callable
      expect(faker['_created_at']()).toBe(date);
      expect(faker.created_at).toBe(date);
    });

    test('should pass index to created_at factory', () => {
      const date = new Date();
      faker.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const castMember = faker.build();
      expect(castMember.created_at.getTime()).toBe(date.getTime() + 2);

      const fakerMany = CastMemberFakeBuilder.theCastMembers(2);
      fakerMany.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const categories = fakerMany.build();

      expect(categories[0].created_at.getTime()).toBe(date.getTime() + 2);
      expect(categories[1].created_at.getTime()).toBe(date.getTime() + 3);
    });
  });

  describe('deleted_at prop', () => {
    const faker = CastMemberFakeBuilder.anActor();
    test('should be a function', () => {
      expect(typeof faker['_deleted_at']).toBe('function');
    });

    test('deleted', () => {
      const $this = faker.deleted();
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_deleted_at']).toBeInstanceOf(Date);
      expect(faker.deleted_at).toBeInstanceOf(Date);
    });

    test('undeleted', () => {
      const $this = faker.undeleted();
      expect($this).toBeInstanceOf(CastMemberFakeBuilder);
      expect(faker['_deleted_at']).toBe(null);
      expect(faker.deleted_at).toBe(null);
    });
  });

  test('should create a cast member', () => {
    const faker = CastMemberFakeBuilder.anActor();
    let castMember = faker.build();

    expect(castMember.cast_member_id).toBeInstanceOf(CastMemberId);
    expect(typeof castMember.name === 'string').toBeTruthy();
    expect(castMember.type).toEqual(CastMemberType.createAnActor());
    expect(castMember.created_at).toBeInstanceOf(Date);

    const created_at = new Date();
    const cast_member_id = new CastMemberId();
    castMember = faker
      .withCastMemberId(cast_member_id)
      .withName('name test')
      .withType(CastMemberType.createADirector())
      .withCreatedAt(created_at)
      .build();

    expect(castMember.cast_member_id.id).toBe(cast_member_id.id);
    expect(castMember.name).toBe('name test');
    expect(castMember.type).toEqual(CastMemberType.createADirector());
    expect(castMember.created_at).toBe(created_at);
    expect(castMember.deleted_at).toBeNull();
  });

  test('should create many cast members', () => {
    const faker = CastMemberFakeBuilder.theCastMembers(2);
    let castMembers = faker.build();

    castMembers.forEach((castMember) => {
      expect(castMember.cast_member_id).toBeInstanceOf(CastMemberId);
      expect(typeof castMember.name === 'string').toBeTruthy();
      expect(castMember.type).toEqual(CastMemberType.createAnActor());
      expect(castMember.created_at).toBeInstanceOf(Date);
      expect(castMember.deleted_at).toBeNull();
    });

    const created_at = new Date();
    const cast_member_id = new CastMemberId();
    castMembers = faker
      .withCastMemberId(cast_member_id)
      .withName('name test')
      .withType(CastMemberType.createADirector())
      .withCreatedAt(created_at)
      .build();

    castMembers.forEach((castMember) => {
      expect(castMember.cast_member_id.id).toBe(cast_member_id.id);
      expect(castMember.name).toBe('name test');
      expect(castMember.type).toEqual(CastMemberType.createADirector());
      expect(castMember.created_at).toBe(created_at);
      expect(castMember.deleted_at).toBeNull();
    });
  });

  test('should create a cast member and nested', () => {
    const faker = CastMemberFakeBuilder.anActorAndNested();
    const [castMember, nested] = faker.build();

    expect(castMember.cast_member_id).toBeInstanceOf(CastMemberId);
    expect(typeof castMember.name === 'string').toBeTruthy();
    expect(castMember.type).toEqual(CastMemberType.createAnActor());
    expect(castMember.created_at).toBeInstanceOf(Date);
    expect(castMember.deleted_at).toBeNull();

    expect(nested.cast_member_id).toBeValueObject(castMember.cast_member_id);
    expect(nested.name).toBe(castMember.name);
    expect(nested.type).toEqual(castMember.type);
    expect(nested.deleted_at).toBeNull();
  });

  test('should create many cast members and nested', () => {
    const faker = CastMemberFakeBuilder.theCastMembersAndNested(2);
    const categories = faker.build();

    categories.forEach(([castMember, nested]) => {
      expect(castMember.cast_member_id).toBeInstanceOf(CastMemberId);
      expect(typeof castMember.name === 'string').toBeTruthy();
      expect(castMember.type).toEqual(CastMemberType.createAnActor());
      expect(castMember.created_at).toBeInstanceOf(Date);
      expect(castMember.deleted_at).toBeNull();

      expect(nested.cast_member_id).toBeValueObject(castMember.cast_member_id);
      expect(nested.name).toBe(castMember.name);
      expect(nested.type).toEqual(castMember.type);
      expect(nested.deleted_at).toBeNull();
    });
  });
});
