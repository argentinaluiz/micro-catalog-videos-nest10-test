import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';

export type SaveCategoryInputConstructorProps = {
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class SaveCategoryInput {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const allowList = ['true', true, 1, '1', 'false', false, 0, '0'];
    if (allowList.includes(value)) {
      return value === 'true' || value === true || value === 1 || value === '1';
    }

    return !value ? null : value;
  })
  is_active: boolean;

  @IsDate({
    message: 'created_at must be a Date instance or a valid date string',
  })
  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  created_at: Date;

  constructor(props?: SaveCategoryInputConstructorProps) {
    if (!props) return;
    this.category_id = props.category_id;
    this.name = props.name;
    this.description = props.description;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
  }
}

export class ValidateSaveCategoryInput {
  static validate(input: SaveCategoryInput) {
    return validateSync(input);
  }
}
