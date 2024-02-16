import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';

@Injectable()
export class KafkaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((...args) => {
        console.log('interceptor');
        console.log(args);
      }),
      catchError((err) => {
        console.log('interceptor');
        console.log(err);
        throw err;
      }),
    );
  }
}
