import {
  KafkaContext,
  KafkaHeaders,
  KafkaOptions,
  ServerKafka,
} from '@nestjs/microservices';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { SchemaRegistryParser } from './schema-registry-parser';
import { ReplaySubject } from 'rxjs';
import { NO_MESSAGE_HANDLER } from '@nestjs/microservices/constants';

export type CustomKafkaServerOptions = KafkaOptions['options'] & {
  schemaRegistry?: SchemaRegistry;
};

export class CustomKafkaServer extends ServerKafka {
  constructor(options: CustomKafkaServerOptions) {
    super(options);

    if (options.schemaRegistry) {
      this.parser = new SchemaRegistryParser(
        options.schemaRegistry,
        options?.parser,
      );
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
    // if the correlation id or reply topic is not set
    // then this is an event (events could still have correlation id)
    if (handler?.isEventHandler || !correlationId || !replyTopic) {
      return this.handleEvent(packet.pattern, packet, kafkaContext);
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
