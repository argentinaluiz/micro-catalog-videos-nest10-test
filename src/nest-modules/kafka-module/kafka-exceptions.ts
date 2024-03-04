import { KafkaRetriableException } from '@nestjs/microservices';
import { DeadLetter } from 'kafkajs-async-retry';

export class CustomKafkaRetriableWithCacheException extends KafkaRetriableException {
  constructor(
    error: string | object,
    readonly topic: string,
    readonly messageOffset: string,
  ) {
    super(error);
  }
}

export class KafkaDeadLetterException extends DeadLetter {
  cause: Error;
  constructor(error: string, cause: Error) {
    super(error);
    this.cause = cause;
  }
}
