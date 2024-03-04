import { Cache } from 'cache-manager';
import { KafkaJSNonRetriableError } from 'kafkajs';
import { CustomKafkaRetriableWithCacheException } from '../kafka-exceptions';
import {
  CustomKafkaServer,
  CustomKafkaServerOptions,
} from './custom-kafka-server';

export class CustomKafkaRetriableWithCacheServer extends CustomKafkaServer {
  private cache: Cache | undefined | null;
  constructor(options: CustomKafkaServerOptions, cache?: Cache) {
    super(options);
    this.cache = cache;
  }

  async start(callback) {
    const consumerOptions = Object.assign(this.options?.consumer || {}, {
      groupId: this.groupId,
    });
    this.consumer = this.client.consumer(consumerOptions);
    this.consumer.on('consumer.crash', async (event) => {
      const error = event.payload.error as KafkaJSNonRetriableError;
      const causeError = error.cause;

      if (causeError instanceof CustomKafkaRetriableWithCacheException) {
        const messageOffset = causeError.messageOffset;
        const topic = causeError.topic;
        const retries = await this.cache!.get(
          `[kafka-retries][topic][${topic}][${messageOffset}]`,
        );
        await this.cache!.set(
          `[kafka-retries][topic][${topic}][${messageOffset}]`,
          retries ? +retries + 1 : 1,
        );
      }
    });
    this.producer = this.client.producer(this.options?.producer);
    await this.consumer.connect();
    await this.producer.connect();
    await this.bindEvents(this.consumer);
    callback();
  }

  listen(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void,
  ): Promise<void> {
    if (!this.cache) {
      throw new Error('Cache not set. Use setCache(cache) to set the cache.');
    }
    return super.listen(callback);
  }

  setCache(cache: Cache) {
    this.cache = cache;
  }
}
