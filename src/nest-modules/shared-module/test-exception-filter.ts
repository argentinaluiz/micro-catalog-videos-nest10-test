import { Abstract, Catch, ExceptionFilter, Type } from '@nestjs/common';

export class TestExceptionFilter {
  static createExceptionFilter(
    onCatch: (exception: any, host: any) => Promise<any>,
    ...exceptions: Array<Type<any> | Abstract<any>>
  ) {
    @Catch(...exceptions)
    class Xpto implements ExceptionFilter {
      async catch(exception: any, host: any) {
        await onCatch(exception, host);
      }
    }

    return Xpto;
  }
}
