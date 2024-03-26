import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { EntityValidationErrorFilter } from './nest-modules/shared-module/entity-validation-error.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalFilters(new EntityValidationErrorFilter());

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
