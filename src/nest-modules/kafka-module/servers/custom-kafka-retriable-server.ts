import { KafkaContext, KafkaHeaders, ReadPacket } from '@nestjs/microservices';
import { KafkaJSNonRetriableError } from 'kafkajs';
import AsyncRetryHelper, { AsyncRetryConfig } from 'kafkajs-async-retry';
import {
  KAFKA_DEFAULT_GROUP,
  NO_EVENT_HANDLER,
  NO_MESSAGE_HANDLER,
} from '@nestjs/microservices/constants';
import { ReplaySubject, isObservable, lastValueFrom } from 'rxjs';
import {} from 'kafkajs-async-retry';
import {
  CustomKafkaServer,
  CustomKafkaServerOptions,
} from './custom-kafka-server';

export type CustomKafkaRetriableServerOptions = CustomKafkaServerOptions & {
  asyncRetryConfig: Pick<
    AsyncRetryConfig,
    'retryTopicNaming' | 'retryDelays' | 'maxRetries' | 'maxWaitTime'
  >;
};

export class CustomKafkaRetriableServer extends CustomKafkaServer {
  private asyncRetryHelper: AsyncRetryHelper | undefined;

  constructor(protected options: CustomKafkaRetriableServerOptions) {
    super(options);
  }

  async start(callback) {
    const consumerOptions = Object.assign(this.options?.consumer || {}, {
      groupId: this.groupId,
    });
    this.consumer = this.client.consumer(consumerOptions);
    this.producer = this.client.producer(this.options?.producer);

    this.asyncRetryHelper = new AsyncRetryHelper({
      producer: this.producer,
      groupId: this.options?.consumer?.groupId || KAFKA_DEFAULT_GROUP,
      retryTopicNaming: this.options.asyncRetryConfig.retryTopicNaming,
      retryDelays: this.options.asyncRetryConfig.retryDelays,
      maxRetries: this.options.asyncRetryConfig.maxRetries,
      maxWaitTime: this.options.asyncRetryConfig.maxWaitTime,
    });

    this.asyncRetryHelper.on('retry', ({ error, topic }) => {
      this.logger.error(
        `Retrying message from topic ${topic} due to error: ${(error as any).message}`,
      );
    });

    this.asyncRetryHelper.on('dead-letter', ({ error, topic }) => {
      this.logger.error(
        `Sending message from topic ${topic} to dead-letter topic due to error: ${(error as any).message}`,
      );
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
          this.logger.log(
            `Retrying message from topic ${payload.originalTopic}`,
          );
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
    const handler = this.getHandlerByPattern(pattern);
    if (!handler) {
      return this.logger.error(NO_EVENT_HANDLER`${pattern}`);
    }
    const resultOrStream = await handler(packet.data, context);
    if (isObservable(resultOrStream)) {
      await lastValueFrom(resultOrStream);
    }
  }

  async handleMessage(payload) {
    const channel = payload.topic;
    const rawMessage = await this.parser.parse(
      Object.assign(payload.message, {
        topic: payload.topic,
        partition: payload.partition,
      }),
    );
    const headers = rawMessage.headers;
    const correlationId = headers[KafkaHeaders.CORRELATION_ID];
    const replyTopic = headers[KafkaHeaders.REPLY_TOPIC];
    const replyPartition = headers[KafkaHeaders.REPLY_PARTITION];
    const packet = await this.deserializer.deserialize(rawMessage, { channel });
    const kafkaContext = new KafkaContext([
      rawMessage,
      payload.partition,
      payload.topic,
      this.consumer,
      payload.heartbeat,
      this.producer,
    ]);
    const handler = this.getHandlerByPattern(packet.pattern);
    const asyncHeaders = kafkaContext.getMessage().headers?.asyncRetry as any;
    const pattern =
      asyncHeaders && !new RegExp(/-dlq$/).test(packet.pattern)
        ? asyncHeaders.top
        : packet.pattern;
    // if the correlation id or reply topic is not set
    // then this is an event (events could still have correlation id)
    if (handler?.isEventHandler || !correlationId || !replyTopic) {
      return this.handleEvent(pattern, packet, kafkaContext);
    }
    const publish = this.getPublisher(
      replyTopic,
      replyPartition,
      correlationId,
    );
    if (!handler) {
      return publish({
        id: correlationId,
        err: NO_MESSAGE_HANDLER,
      });
    }
    const response$ = this.transformToObservable(
      handler(packet.data, kafkaContext),
    );
    const replayStream$ = new ReplaySubject();
    await this['combineStreamsAndThrowIfRetriable'](response$, replayStream$);
    this.send(replayStream$, publish);
  }
}
