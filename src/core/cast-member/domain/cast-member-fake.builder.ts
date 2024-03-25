import { Chance } from 'chance';
import { CastMember, CastMemberId } from './cast-member.aggregate';
import { NestedCastMember } from '../../cast-member/domain/nested-cast-member.entity';
import { CastMemberType } from './cast-member-type.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export enum CastMemberFakeMode {
  ONLY_AGGREGATE = 'ONLY_AGGREGATE',
  ONLY_NESTED = 'ONLY_NESTED',
  BOTH = 'BOTH',
}

export class CastMemberFakeBuilder<TBuild = any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _cast_member_id: PropOrFactory<CastMemberId> = (_index) =>
    new CastMemberId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _name: PropOrFactory<string> = (_index) => this.chance.word();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _type: PropOrFactory<CastMemberType> = (_index) =>
    CastMemberType.createAnActor();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _created_at: PropOrFactory<Date> = (_index) => new Date();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private mode: CastMemberFakeMode;
  private chance: Chance.Chance;

  private constructor(
    countObjs: number = 1,
    mode = CastMemberFakeMode.ONLY_AGGREGATE,
  ) {
    this.countObjs = countObjs;
    this.mode = mode;
    this.chance = Chance();
  }

  static aDirector() {
    return new CastMemberFakeBuilder<CastMember>().withType(
      CastMemberType.createADirector(),
    );
  }

  static aNestedDirector() {
    return new CastMemberFakeBuilder<NestedCastMember>(
      1,
      CastMemberFakeMode.ONLY_NESTED,
    ).withType(CastMemberType.createADirector());
  }

  static aDirectorAndNested() {
    return new CastMemberFakeBuilder<[CastMember, NestedCastMember]>(
      1,
      CastMemberFakeMode.BOTH,
    );
  }

  static anActor() {
    return new CastMemberFakeBuilder<CastMember>().withType(
      CastMemberType.createAnActor(),
    );
  }

  static aNestedActor() {
    return new CastMemberFakeBuilder<NestedCastMember>(
      1,
      CastMemberFakeMode.ONLY_NESTED,
    ).withType(CastMemberType.createAnActor());
  }

  static anActorAndNested() {
    return new CastMemberFakeBuilder<[CastMember, NestedCastMember]>(
      1,
      CastMemberFakeMode.BOTH,
    );
  }

  static theActors(countObjs: number) {
    return new CastMemberFakeBuilder<CastMember[]>(countObjs).withType(
      CastMemberType.createAnActor(),
    );
  }

  static theActorsAndNested(countObjs: number) {
    return new CastMemberFakeBuilder<[CastMember, NestedCastMember][]>(
      countObjs,
      CastMemberFakeMode.BOTH,
    );
  }

  static theNestedActors(countObjs: number) {
    return new CastMemberFakeBuilder<NestedCastMember[]>(
      countObjs,
      CastMemberFakeMode.ONLY_NESTED,
    ).withType(CastMemberType.createAnActor());
  }

  static theDirectors(countObjs: number) {
    return new CastMemberFakeBuilder<CastMember[]>(countObjs).withType(
      CastMemberType.createADirector(),
    );
  }

  static theDirectorsAndNested(countObjs: number) {
    return new CastMemberFakeBuilder<[CastMember, NestedCastMember][]>(
      countObjs,
      CastMemberFakeMode.BOTH,
    );
  }

  static theNestedDirectors(countObjs: number) {
    return new CastMemberFakeBuilder<NestedCastMember[]>(
      countObjs,
      CastMemberFakeMode.ONLY_NESTED,
    ).withType(CastMemberType.createADirector());
  }

  static theCastMembers(countObjs: number) {
    return new CastMemberFakeBuilder<CastMember[]>(countObjs);
  }

  static theCastMembersAndNested(countObjs: number) {
    return new CastMemberFakeBuilder<[CastMember, NestedCastMember][]>(
      countObjs,
      CastMemberFakeMode.BOTH,
    );
  }

  withCastMemberId(valueOrFactory: PropOrFactory<CastMemberId>) {
    this._cast_member_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  withType(valueOrFactory: PropOrFactory<CastMemberType>) {
    this._type = valueOrFactory;
    return this;
  }

  withInvalidNameTooLong(value?: string) {
    this._name = value ?? this.chance.word({ length: 256 });
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  deleted() {
    this._deleted_at = new Date();
    return this;
  }

  undeleted() {
    this._deleted_at = null;
    return this;
  }

  build(): TBuild {
    const castMembers = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        if (this.mode === CastMemberFakeMode.ONLY_NESTED) {
          const nested = new NestedCastMember({
            cast_member_id: this.callFactory(this._cast_member_id, index),
            name: this.callFactory(this._name, index),
            type: this.callFactory(this._type, index),
          });
          nested.validate();
          return nested;
        }

        if (this.mode === CastMemberFakeMode.ONLY_AGGREGATE) {
          const castMember = new CastMember({
            cast_member_id: this.callFactory(this._cast_member_id, index),
            name: this.callFactory(this._name, index),
            type: this.callFactory(this._type, index),
            created_at: this.callFactory(this._created_at, index),
            deleted_at: this.callFactory(this._deleted_at, index),
          });
          castMember.validate();
          return castMember;
        }

        if (this.mode === CastMemberFakeMode.BOTH) {
          const castMember = new CastMember({
            cast_member_id: this.callFactory(this._cast_member_id, index),
            name: this.callFactory(this._name, index),
            type: this.callFactory(this._type, index),
            created_at: this.callFactory(this._created_at, index),
            deleted_at: this.callFactory(this._deleted_at, index),
          });
          castMember.validate();
          const nested = new NestedCastMember({
            cast_member_id: castMember.cast_member_id,
            name: castMember.name,
            type: castMember.type,
          });
          nested.validate();
          return [castMember, nested];
        }
      });
    return this.countObjs === 1 ? (castMembers[0] as any) : castMembers;
  }

  get cast_member_id() {
    return this.getValue('cast_member_id');
  }

  get name() {
    return this.getValue('name');
  }

  get type() {
    return this.getValue('type');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get deleted_at() {
    return this.getValue('deleted_at');
  }

  private getValue(prop: any) {
    const privateProp = `_${prop}` as keyof this;
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }
}
