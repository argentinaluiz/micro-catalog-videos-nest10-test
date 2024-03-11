import { Transform } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';
import { CastMemberTypes } from '../../../domain/cast-member-type.vo';

export type SaveCastMemberInputConstructorProps = {
  cast_member_id: string;
  name: string;
  type: CastMemberTypes;
  created_at: Date;
};

export class SaveCastMemberInput {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  cast_member_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  type: CastMemberTypes;

  @IsDate({
    message: 'created_at must be a Date instance or a valid date string',
  })
  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  created_at: Date;

  constructor(props?: SaveCastMemberInputConstructorProps) {
    if (!props) return;
    this.cast_member_id = props.cast_member_id;
    this.name = props.name;
    this.type = props.type;
    this.created_at = props.created_at;
  }
}

export class ValidateSaveCastMemberInput {
  static validate(input: SaveCastMemberInput) {
    return validateSync(input);
  }
}
