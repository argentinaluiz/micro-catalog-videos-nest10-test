import { Controller, UseInterceptors } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  KafkaRetriableException,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { KafkaInterceptor } from './kafka/kafka.interceptor';
import { KafkaJSNonRetriableError } from 'kafkajs';

@Controller()
export class KafkaController {
  //@UseInterceptors(KafkaInterceptor)
  @EventPattern('topic')
  xpto(@Payload() message, @Ctx() ctx: KafkaContext) {
    //console.log(context);
    // const error = new KafkaJSNonRetriableError('testtttttttttttttt');
    // error.retriable = false;
    // throw error;
    throw new CustomError('test1111');
    // const error = new RpcException('test');
    // error.retriable = false;
    // throw error;
    //throw new KafkaJSNonRetriableError('test');
    // const error = new CustomError('test');
    // error.retriable = false;
    // throw error;
    //throw new KafkaRetriableException({ message: 'test' });
  }
}

class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}
