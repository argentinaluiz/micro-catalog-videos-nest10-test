import {
  KafkaContext,
  KafkaOptions,
  ReadPacket,
  ServerKafka,
} from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { KafkaJSNonRetriableError } from 'kafkajs';
import { CustomKafkaRetriableException } from './custom-kafka-retriable-exception';
import AsyncRetryHelper, { RetryTopicNaming } from 'kafkajs-async-retry';
import {
  KAFKA_DEFAULT_GROUP,
  NO_EVENT_HANDLER,
} from '@nestjs/microservices/constants';
import { isObservable, lastValueFrom } from 'rxjs';
import {} from 'kafkajs-async-retry';

export class CustomAsyncKafkaServer extends ServerKafka {
  private cache: Cache | undefined | null;
  private asyncRetryHelper: AsyncRetryHelper | undefined;
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
      //console.log(JSON.stringify(causeError));
      //@ts-expect-error - error.waitMs is a number
      if (typeof causeError.waitMs === 'number') {
        //@ts-expect-error - error.waitMs is a number
        console.log('Reconnecting consumer in ' + causeError.waitMs + 'ms');
        setTimeout(async () => {
          await this.consumer.connect();
          await this.bindEvents(this.consumer);
          //@ts-expect-error - error.waitMs is a number
        }, causeError.waitMs + 1000);
      }
      // if (causeError instanceof WaitBeforeProcessing) {
      //   setTimeout(async () => {
      //     await this.consumer.connect();
      //     await this.bindEvents(this.consumer);
      //   }, 500);
      //   // const handler = this.getMessageHandler();
      //   // const consumerRunOptions = Object.assign(this.options!.run || {}, {
      //   //   eachMessage: this.asyncRetryHelper!.eachMessage(async (payload) => {
      //   //     if (payload.previousAttempts > 0) {
      //   //       console.log(
      //   //         `Retrying message from topic ${payload.originalTopic}`,
      //   //       );
      //   //     }
      //   //     // do something with the message (exceptions will be caught and the
      //   //     // message will be sent to the appropriate retry or dead-letter topic)
      //   //     await handler(payload);
      //   //   }),
      //   // });
      //   // await this.consumer.run(consumerRunOptions);
      // }
    });
    this.producer = this.client.producer(this.options?.producer);

    this.asyncRetryHelper = new AsyncRetryHelper({
      producer: this.producer,
      groupId: this.options?.consumer?.groupId || KAFKA_DEFAULT_GROUP,
      retryTopicNaming: RetryTopicNaming.DELAY_BASED,
      retryDelays: [10, 20],
      maxRetries: 3,
    });

    await this.consumer.connect();
    await this.producer.connect();
    await this.bindEvents(this.consumer);
    callback();
  }

  async bindEvents(consumer) {
    const registeredPatterns = [...this.messageHandlers.keys()];
    const consumerSubscribeOptions = this.options!.subscribe || {};
    if (registeredPatterns.length > 0) {
      await this.consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: registeredPatterns,
      });

      await this.consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: this.asyncRetryHelper!.retryTopics,
      });
    }
    const handler = this.getMessageHandler();
    const consumerRunOptions = Object.assign(this.options!.run || {}, {
      eachMessage: this.asyncRetryHelper!.eachMessage(async (payload) => {
        if (payload.previousAttempts > 0) {
          console.log(`Retrying message from topic ${payload.originalTopic}`);
        }
        // do something with the message (exceptions will be caught and the
        // message will be sent to the appropriate retry or dead-letter topic)
        await handler(payload);
      }),
    });
    await consumer.run(consumerRunOptions);
  }

  async handleEvent(
    pattern: string,
    packet: ReadPacket,
    context: KafkaContext,
  ) {
    const headers = context?.getMessage()?.headers;
    const asyncHeaders = headers?.asyncRetry;
    //@ts-expect-error - asyncHeaders is already a object
    pattern = asyncHeaders ? asyncHeaders.top : pattern;
    const handler = this.getHandlerByPattern(pattern);
    if (!handler) {
      return this.logger.error(NO_EVENT_HANDLER`${pattern}`);
    }
    const resultOrStream = await handler(packet.data, context);
    if (isObservable(resultOrStream)) {
      await lastValueFrom(resultOrStream);
    }
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
