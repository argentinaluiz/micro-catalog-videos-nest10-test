import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import { KafkaContext, KafkaRetriableException } from '@nestjs/microservices';
import { NotFoundError } from '../core/shared/domain/errors/not-found.error';
import { EntityValidationError } from '../core/shared/domain/validators/validation.error';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CustomKafkaRetriableException } from '../nest-modules/kafka-module/custom-kafka-retriable-exception';
import { throwError } from 'rxjs';

@Catch()
export class AsyncKafkaErrorFilter implements ExceptionFilter {
  static readonly MAX_RETRIES_BETWEEN_RESTARTS = 4;

  static readonly NON_RETRIABLE_ERRORS = [
    NotFoundError,
    EntityValidationError,
    UnprocessableEntityException,
  ];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async catch(exception: Error, host: ArgumentsHost) {
    throw exception;
    //throwError(() => new KafkaRetriableException({ message: 'test' }));
    // console.log('KafkaErrorFilter.catch');
    // const ctx: KafkaContext = host.switchToRpc().getContext();

    // if (!(ctx instanceof KafkaContext)) {
    //   return;
    // }

    // const hasNonRetriableError = KafkaErrorFilter.NON_RETRIABLE_ERRORS.some(
    //   (error) => exception instanceof error,
    // );

    // if (hasNonRetriableError) {
    //   await this.releaseOffset(ctx, exception);
    //   return;
    // }

    // const hasExceededRetries = await this.hasExceededRetries(
    //   ctx.getTopic(),
    //   ctx.getMessage().offset,
    // );

    // if (hasExceededRetries) {
    //   await this.releaseOffset(ctx, exception);
    //   await this.cacheManager.del(
    //     `[kafka-retries][topic][${ctx.getTopic()}][${ctx.getMessage().offset}]`,
    //   );
    //   return;
    // }

    // throw new CustomKafkaRetriableException(
    //   exception,
    //   ctx.getTopic(),
    //   ctx.getMessage().offset,
    // );
  }

  // private async hasExceededRetries(topic: string, messageOffset: string) {
  //   const retriesRaw = await this.cacheManager.get(
  //     `[kafka-retries][topic][${topic}][${messageOffset}]`,
  //   );

  //   const retries = Number(retriesRaw) || 0;
  //   return retries >= KafkaErrorFilter.MAX_RETRIES_BETWEEN_RESTARTS;
  // }

  // async releaseOffset(ctx: KafkaContext, exception: Error) {
  //   console.log('releaseOffset');
  //   const message = JSON.parse(ctx.getMessage().value!.toString());
  //   console.log(
  //     await ctx.getProducer().send({
  //       topic: 'dlq.catalog',
  //       messages: [
  //         {
  //           value: JSON.stringify({
  //             error: exception.message,
  //             message,
  //           }),
  //         },
  //       ],
  //     }),
  //     'send to dlq',
  //   );
  //   await ctx.getConsumer().commitOffsets([
  //     {
  //       topic: ctx.getTopic(),
  //       partition: ctx.getPartition(),
  //       offset: ctx.getMessage().offset,
  //     },
  //   ]);
  // }
}
