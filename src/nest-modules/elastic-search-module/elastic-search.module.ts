import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ElasticsearchModule,
  ElasticsearchService,
} from '@nestjs/elasticsearch';

@Global()
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('ELASTIC_SEARCH_HOST'),
        // auth: {
        //   username: configService.get<string>('ELASTIC_SEARCH_USERNAME'),
        //   password: configService.get<string>('ELASTIC_SEARCH_PASSWORD'),
        // },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'ES_INDEX',
      useFactory: (configService: ConfigService) =>
        configService.get<string>('ELASTIC_SEARCH_INDEX'),
      inject: [ConfigService],
    },
  ],
  exports: [ElasticsearchModule, 'ES_INDEX'],
})
export class ElasticSearchModule {}
