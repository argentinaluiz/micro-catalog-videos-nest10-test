import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { CacheModule } from '@nestjs/cache-manager';
// import memcachedStore from 'cache-manager-memcached-store';
// import Memcache from 'memcache-pp';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { ConfigModule } from './nest-modules/config-module/config.module';
import { CategoriesModule } from './nest-modules/categories-module/categories.module';
import { ElasticSearchModule } from './nest-modules/elastic-search-module/elastic-search.module';
import { KafkaModule } from './nest-modules/kafka-module/kafka.module';
import { GenresModule } from './nest-modules/genres-module/genres.module';
import { CastMembersModule } from './nest-modules/cast-members-module/cast-members.module';
import { VideosModule } from './nest-modules/videos-modules/videos.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';

export const appConfigurationModule = ConfigModule.forRoot();

@Module({
  imports: [
    appConfigurationModule,
    DiscoveryModule,
    // CacheModule.registerAsync({
    //   useFactory: async () => {
    //     return {
    //       store: memcachedStore,
    //       driver: Memcache,
    //       options: {
    //         hosts: ['memcached:11211'],
    //       },
    //     };
    //   },
    // }),
    KafkaModule,
    ElasticSearchModule,
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    CategoriesModule.forRoot(),
    GenresModule.forRoot(),
    CastMembersModule.forRoot(),
    VideosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
