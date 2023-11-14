import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'my-kafka-consumer',
      },
    },
  });

  await app.listen();
}
bootstrap();
