import { IsIn, IsNotEmpty, IsObject, ValidateIf } from 'class-validator';

enum SchemaOperation {
  READ = 'r',
  CREATE = 'c',
  UPDATE = 'u',
  DELETE = 'd',
}

export class SchemaPayloadDto {
  @IsIn([
    SchemaOperation.READ,
    SchemaOperation.CREATE,
    SchemaOperation.UPDATE,
    SchemaOperation.DELETE,
  ])
  @IsNotEmpty()
  op: SchemaOperation;

  @IsObject()
  @ValidateIf((object, value) => value !== null)
  after: any;

  @IsObject()
  @ValidateIf((object, value) => value !== null)
  before: any;
}

export class SchemaChangesDto {
  payload: SchemaPayloadDto;
}
