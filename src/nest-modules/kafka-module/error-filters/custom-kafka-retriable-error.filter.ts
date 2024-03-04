import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnprocessableEntityException,
} from '@nestjs/common';
import { KafkaContext, KafkaRetriableException } from '@nestjs/microservices';
import { EntityValidationError } from '../../../core/shared/domain/validators/validation.error';
import { KafkaDeadLetterException } from '../kafka-exceptions';

@Catch()
export class CustomKafkaRetriableErrorFilter implements ExceptionFilter {
  static readonly MAX_RETRIES_BETWEEN_RESTARTS = 4;

  static readonly NON_RETRIABLE_ERRORS = [
    EntityValidationError,
    UnprocessableEntityException,
  ];

  async catch(exception: Error, host: ArgumentsHost) {
    const ctx: KafkaContext = host.switchToRpc().getContext();

    if (!(ctx instanceof KafkaContext)) {
      return;
    }

    const hasNonRetriableError =
      CustomKafkaRetriableErrorFilter.NON_RETRIABLE_ERRORS.some(
        (error) => exception instanceof error,
      );

    if (hasNonRetriableError) {
      throw new KafkaDeadLetterException(exception.message, exception);
    }

    throw new KafkaRetriableException(exception);
  }
}
