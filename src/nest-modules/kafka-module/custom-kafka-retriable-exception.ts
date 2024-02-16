import { KafkaRetriableException } from '@nestjs/microservices';

export class CustomKafkaRetriableException extends KafkaRetriableException {
  constructor(
    error: string | object,
    readonly topic: string,
    readonly messageOffset: string,
  ) {
    super(error);
  }
}
