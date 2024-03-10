import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';

export type SaveGenreInputConstructorProps = {
  genre_id: string;
  name: string;
  categories_id: string[];
  is_active: boolean;
  created_at: Date;
};

export class SaveGenreInput {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  genre_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID('4', { each: true })
  @IsArray()
  @IsNotEmpty()
  categories_id: string[];

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

  constructor(props?: SaveGenreInputConstructorProps) {
    if (!props) return;
    this.genre_id = props.genre_id;
    this.name = props.name;
    this.categories_id = props.categories_id;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
  }
}

export class ValidateSaveGenreInput {
  static validate(input: SaveGenreInput) {
    return validateSync(input);
  }
}
