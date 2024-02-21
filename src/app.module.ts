import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaController } from './kafka.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { KafkaRetryController } from './kafka-retry/kafka-retry.controller';
import { KafkaModule } from './kafka/kafka.module';
import memcachedStore from 'cache-manager-memcached-store';
import Memcache from 'memcache-pp';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        return {
          store: memcachedStore,
          driver: Memcache,
          options: {
            hosts: ['memcached:11211'],
          },
        };
      },
    }),
    KafkaModule,
  ],
  controllers: [AppController, KafkaController, KafkaRetryController],
  providers: [AppService],
})
export class AppModule {}
