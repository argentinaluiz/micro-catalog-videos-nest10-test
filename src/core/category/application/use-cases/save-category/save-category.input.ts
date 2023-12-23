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
  category_id?: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class SaveCategoryInput {
  @IsUUID('4')
  @IsString()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsDate()
  @IsNotEmpty()
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
