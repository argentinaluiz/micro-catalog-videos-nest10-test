import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';

export type CreateCategoryInputConstructorProps = {
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class CreateCategoryInput {
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
  @IsOptional()
  is_active: boolean;

  @IsDate()
  @IsNotEmpty()
  created_at: Date;

  constructor(props?: CreateCategoryInputConstructorProps) {
    if (!props) return;
    this.category_id = props.category_id;
    this.name = props.name;
    this.description = props.description;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
  }
}

export class ValidateCreateCategoryInput {
  static validate(input: CreateCategoryInput) {
    return validateSync(input);
  }
}
