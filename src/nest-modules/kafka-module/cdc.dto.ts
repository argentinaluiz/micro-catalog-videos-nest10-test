import { IsIn, IsNotEmpty, IsObject, ValidateIf } from 'class-validator';

export enum CDCOperation {
  READ = 'r',
  CREATE = 'c',
  UPDATE = 'u',
  DELETE = 'd',
}

export class CDCPayloadDto<T = any> {
  @IsIn([
    CDCOperation.READ,
    CDCOperation.CREATE,
    CDCOperation.UPDATE,
    CDCOperation.DELETE,
  ])
  @IsNotEmpty()
  op: CDCOperation;

  @IsObject()
  @ValidateIf((object, value) => value !== null)
  after: T | null;

  @IsObject()
  @ValidateIf((object, value) => value !== null)
  before: T | null;
}

export class CDCMessageDto {
  payload: CDCPayloadDto;
}
