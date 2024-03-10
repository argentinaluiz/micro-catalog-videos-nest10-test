import { DiscoveryService, NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CustomKafkaRetriableServer } from '../nest-modules/kafka-module/servers/custom-kafka-retriable-server';
import { ConfigModule } from '../nest-modules/config-module/config.module';
import { ConfigService } from '@nestjs/config';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { RetryTopicNaming } from 'kafkajs-async-retry';
import { CustomKafkaRetriableErrorFilter } from '../nest-modules/kafka-module/error-filters/custom-kafka-retriable-error.filter';
import { KafkaModule } from '../nest-modules/kafka-module/kafka.module';
import { KConnectEventPatternRegister } from '../nest-modules/kafka-module/kconnect-event-pattern-register';
// import { CustomKafkaRetriableWithCacheServer } from '../nest-modules/kafka-module/servers/custom-kafka-retriable-with-cache-server';
// import { CustomKafkaRetriableWithCacheErrorFilter } from '../nest-modules/kafka-module/error-filters/custom-kafka-retriable-with-cache-error.filter';
//import { CACHE_MANAGER } from '@nestjs/cache-manager';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(
    ConfigModule.forRoot(),
  );

  const configService = appContext.get(ConfigService);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new CustomKafkaRetriableServer({
        asyncRetryConfig: {
          maxRetries: 3,
          maxWaitTime: 3000,
          retryDelays: [1, 2, 3, 5, 6],
          retryTopicNaming: RetryTopicNaming.ATTEMPT_BASED,
        },
        schemaRegistry: new SchemaRegistry({
          host: configService.get<string>(
            'kafka.schema_registry_url',
          ) as string,
        }),
        client: {
          brokers: configService.get<string[]>('kafka.brokers') as string[],
        },
        consumer: {
          groupId: configService.get<string>(
            'kafka.consumer_group_id',
          ) as string,
        },
        subscribe: {
          fromBeginning: configService.get<boolean>(
            'kafka.from_beginning',
          ) as boolean,
        },
      }),
    },
  );

  await app.get(KConnectEventPatternRegister).registerKConnectTopicDecorator();

  // const cache = app.get(CACHE_MANAGER);
  // app['server'].setCache(cache);
  // const app = await NestFactory.create(AppModule);

  // const cache = app.get(CACHE_MANAGER);

  // app.connectMicroservice<MicroserviceOptions>({
  //   strategy: new CustomKafkaServer(
  //     {
  //       client: {
  //         brokers: ['kafka:29092'],
  //       },
  //       consumer: {
  //         groupId: 'my-kafka-consumer',
  //       },
  //       run: {
  //         autoCommit: false,
  //       },
  //     },
  //     cache,
  //   ),
  //   // transport: Transport.KAFKA,
  //   // options: {
  //   //   client: {
  //   //     brokers: ['kafka:29092'],
  //   //   },
  //   //   consumer: {
  //   //     groupId: 'my-kafka-consumer',
  //   //   },
  //   //   run: {
  //   //     autoCommit: false,
  //   //   }
  //   // },
  // });

  app.useGlobalFilters(new CustomKafkaRetriableErrorFilter());
  //  app.useGlobalFilters(new AsyncKafkaErrorFilter(cache));
  await app.listen();
}
bootstrap();

// async function bootstrapUsingCache() {
//   const appContext = await NestFactory.createApplicationContext(
//     ConfigModule.forRoot(),
//   );

//   const configService = appContext.get(ConfigService);

//   const app = await NestFactory.createMicroservice<MicroserviceOptions>(
//     AppModule,
//     {
//       strategy: new CustomKafkaRetriableWithCacheServer({
//         schemaRegistry: new SchemaRegistry({
//           host: configService.get<string>(
//             'kafka.schema_registry_url',
//           ) as string,
//         }),
//         client: {
//           brokers: configService.get<string[]>('kafka.brokers') as string[],
//         },
//         consumer: {
//           groupId: configService.get<string>(
//             'kafka.consumer_group_id',
//           ) as string,
//         },
//         subscribe: {
//           fromBeginning: configService.get<boolean>(
//             'kafka.from_beginning',
//           ) as boolean,
//         },
//       }),
//     },
//   );

//   const cache = app.get(CACHE_MANAGER);
//   app['server'].setCache(cache);

//   app.useGlobalFilters(new CustomKafkaRetriableWithCacheErrorFilter(cache));

//   await app.init();
//   await app.listen();
// }
