import { DiscoveryService } from '@golevelup/nestjs-discovery';
import { ConfigService } from '@nestjs/config';
import { K_CONNECT_TOPIC_METADATA } from './kconnect-event-pattern.decorator';
import { EventPattern } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KConnectEventPatternRegister {
  constructor(
    private readonly configService: ConfigService,
    private readonly discoverService: DiscoveryService,
  ) {}

  // precisa registrar antes de chamar o listen do microservice
  // para que os eventpattern personalizados sejam registrados
  // um evento de módulo init ou similar é executado depois que o listen já identificou os eventpatterns padrões
  async registerKConnectTopicDecorator() {
    const methodsDiscovered =
      await this.discoverService.methodsAndControllerMethodsWithMetaAtKey(
        K_CONNECT_TOPIC_METADATA,
      );

    methodsDiscovered.forEach((method) => {
      const topicName = KConnectEventPatternRegister.kConnectTopicName(
        this.configService.get('kafka.connect_prefix') as string,
        method.meta as string,
      );
      Reflect.decorate(
        [EventPattern(topicName)],
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
