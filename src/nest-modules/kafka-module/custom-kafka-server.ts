import { KafkaOptions, ServerKafka } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { KafkaJSNonRetriableError } from 'kafkajs';
import { CustomKafkaRetriableException } from './custom-kafka-retriable-exception';

export class CustomKafkaServer extends ServerKafka {
  private cache: Cache | undefined | null;
  constructor(options: KafkaOptions['options'], cache?: Cache) {
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

      if (causeError instanceof CustomKafkaRetriableException) {
        const messageOffset = causeError.messageOffset;
        const topic = causeError.topic;
        console.log('cache', this.cache)
        console.log(`[kafka-retries][topic][${topic}][${messageOffset}]`);
        const retries = await this.cache!.get(
          `[kafka-retries][topic][${topic}][${messageOffset}]`,
        );
        console.log('retries', retries);
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
