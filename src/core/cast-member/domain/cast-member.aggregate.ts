import { CastMemberFakeBuilder } from './cast-member-fake.builder';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import CastMemberValidatorFactory from './cast-member.validator';
import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { CastMemberType } from './cast-member-type.vo';

export type CastMemberConstructorProps = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
  deleted_at?: Date | null;
};

export type CastMemberCreateCommand = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
};

export class CastMemberId extends Uuid {}

export class CastMember extends AggregateRoot {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: CastMemberConstructorProps) {
    super();
    this.cast_member_id = props.cast_member_id;
    this.name = props.name;
    this.type = props.type;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: CastMemberCreateCommand) {
    const cast_member = new CastMember(props);
    cast_member.validate(['name']);
    return cast_member;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeType(type: CastMemberType): void {
    this.type = type;
  }

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = CastMemberValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsNotDeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return CastMemberFakeBuilder;
  }

  get entity_id() {
    return this.cast_member_id;
  }

  toJSON() {
    return {
      cast_member_id: this.cast_member_id.id,
      name: this.name,
      type: this.type.type,
      created_at: this.created_at,
      deleted_at: this.deleted_at,
    };
  }
}
