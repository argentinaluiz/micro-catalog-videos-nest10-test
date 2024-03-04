import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  UnprocessableEntityException,
} from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { EntityValidationError } from '../../../core/shared/domain/validators/validation.error';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CustomKafkaRetriableWithCacheException } from '../kafka-exceptions';

@Catch()
export class CustomKafkaRetriableWithCacheErrorFilter
  implements ExceptionFilter
{
  static readonly MAX_RETRIES_BETWEEN_RESTARTS = 4;

  static readonly NON_RETRIABLE_ERRORS = [
    EntityValidationError,
    UnprocessableEntityException,
  ];

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async catch(exception: Error, host: ArgumentsHost) {
    const ctx: KafkaContext = host.switchToRpc().getContext();

    if (!(ctx instanceof KafkaContext)) {
      return;
    }

    const hasNonRetriableError =
      CustomKafkaRetriableWithCacheErrorFilter.NON_RETRIABLE_ERRORS.some(
        (error) => exception instanceof error,
      );

    if (hasNonRetriableError) {
      await this.releaseOffset(ctx);
      return;
    }

    const hasExceededRetries = await this.hasExceededRetries(
      ctx.getTopic(),
      ctx.getMessage().offset,
    );

    if (hasExceededRetries) {
      await this.releaseOffset(ctx);
      await this.cacheManager.del(
        `[kafka-retries][topic][${ctx.getTopic()}][${ctx.getMessage().offset}]`,
      );
      return;
    }

    throw new CustomKafkaRetriableWithCacheException(
      exception,
      ctx.getTopic(),
      ctx.getMessage().offset,
    );
  }

  private async hasExceededRetries(topic: string, messageOffset: string) {
    const retriesRaw = await this.cacheManager.get(
      `[kafka-retries][topic][${topic}][${messageOffset}]`,
    );

    const retries = Number(retriesRaw) || 0;
    return (
      retries >=
      CustomKafkaRetriableWithCacheErrorFilter.MAX_RETRIES_BETWEEN_RESTARTS
    );
  }

  async releaseOffset(ctx: KafkaContext) {
    await ctx.getConsumer().commitOffsets([
      {
        topic: ctx.getTopic(),
        partition: ctx.getPartition(),
        offset: ctx.getMessage().offset,
      },
    ]);
  }
}
