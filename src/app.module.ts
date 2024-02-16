import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaController } from './kafka.controller';
import { CacheModule } from '@nestjs/cache-manager';
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
  ],
  controllers: [AppController, KafkaController],
  providers: [AppService],
})
export class AppModule {}
