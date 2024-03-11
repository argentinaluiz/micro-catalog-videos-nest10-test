import { Entity } from '../../shared/domain/entity';
import { CastMemberType } from './cast-member-type.vo';
import { CastMemberId } from './cast-member.aggregate';
import NestedCastMemberValidatorFactory from './nested-cast-member.validator';

export type NestedCastMemberConstructorProps = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  deleted_at?: Date | null;
};

export type NestedCastMemberCreateCommand = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
};

export class NestedCastMember extends Entity {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  deleted_at: Date | null = null;

  constructor(props: NestedCastMemberConstructorProps) {
    super();
    this.cast_member_id = props.cast_member_id;
    this.name = props.name;
    this.type = props.type;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: NestedCastMemberCreateCommand) {
    const nestedCastMember = new NestedCastMember(props);
    nestedCastMember.validate(['name']);
    return nestedCastMember;
  }

  get entity_id() {
    return this.cast_member_id;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeType(type: CastMemberType): void {
    this.type = type;
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsNotDeleted() {
    this.deleted_at = null;
  }

  validate(fields?: string[]) {
    const validator = NestedCastMemberValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  toJSON() {
    return {
      cast_member_id: this.cast_member_id.id,
      name: this.name,
      type: this.type.type,
      deleted_at: this.deleted_at,
    };
  }
}
