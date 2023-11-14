import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  @EventPattern('topic')
  xpto(@Payload() message) {
    console.log(message);
  }
}
