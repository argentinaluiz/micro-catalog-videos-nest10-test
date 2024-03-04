import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern } from '@nestjs/microservices';
import { K_CONNECT_TOPIC_METADATA } from './kconnect-event-pattern.decorator';

@Module({})
export class KafkaModule implements OnModuleInit {
  constructor(
    private readonly discover: DiscoveryService,
    private configService: ConfigService,
  ) {}

  //get application instance
  async onModuleInit() {
    const methodsDiscovered =
      await this.discover.methodsAndControllerMethodsWithMetaAtKey(
        K_CONNECT_TOPIC_METADATA,
      );

    methodsDiscovered.forEach((method) => {
      Reflect.decorate(
        [
          EventPattern(
            `${this.configService.get('kafka.connect_prefix')}.${method.meta}`,
          ),
        ],
        method.discoveredMethod.parentClass.injectType?.prototype,
        method.discoveredMethod.methodName,
        Reflect.getOwnPropertyDescriptor(
          method.discoveredMethod.parentClass.injectType?.prototype,
          method.discoveredMethod.methodName,
        ),
      );
    });
  }

  static kConnectTopicName(prefix: string, topic: string) {
    return `${prefix}.${topic}`;
  }
}
