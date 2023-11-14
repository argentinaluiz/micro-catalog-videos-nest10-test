import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';

export type UpdateCategoryInputConstructorProps = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date
};

export class UpdateCategoryInput {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
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

  constructor(props?: UpdateCategoryInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.is_active = props.is_active;
    this.created_at = new Date();
  }
}

export class ValidateUpdateCategoryInput {
  static validate(input: UpdateCategoryInput) {
    return validateSync(input);
  }
}
