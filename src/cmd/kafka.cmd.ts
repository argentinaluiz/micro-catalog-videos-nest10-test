import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { KafkaErrorFilter } from '../kafka-error/kafka-error.filter';
import { CustomKafkaServer } from '../nest-modules/kafka-module/custom-kafka-server';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: new CustomKafkaServer({
        client: {
          brokers: ['kafka:29092'],
        },
        consumer: {
          groupId: 'my-kafka-consumer',
        },
        run: {
          autoCommit: false,
        },
      }),
    },
  );
  const cache = app.get(CACHE_MANAGER);
  app['server'].setCache(cache);
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

  // // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  // //   AppModule,
  // //   {
  // //     transport: Transport.KAFKA,
  // //     options: {
  // //       client: {
  // //         brokers: ['kafka:29092'],
  // //       },
  // //       consumer: {
  // //         groupId: 'my-kafka-consumer',
  // //       },
  // //       run: {
  // //         autoCommit: false,
  // //       },
  // //     },
  // //   },
  // // );

  // //console.log(app.get(ServerKafka));

  app.useGlobalFilters(new KafkaErrorFilter(cache));
  app.listen();
  // await app.init();
  // app.getMicroservices()[0].
  // await app.startAllMicroservices();
  // console.log('Kafka microservice is running');
}
bootstrap();
