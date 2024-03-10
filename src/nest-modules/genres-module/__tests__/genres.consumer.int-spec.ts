import { Test, TestingModule } from '@nestjs/testing';
import { GenresModule } from '../genres.module';
import { ConfigModule } from '../../config-module/config.module';
import { ElasticSearchModule } from '../../elastic-search-module/elastic-search.module';
import {
  setupElasticSearch,
  setupKafka,
} from '../../../core/shared/infra/testing/helpers';
import crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { GENRE_PROVIDERS } from '../genres.providers';
import { IGenreRepository } from '../../../core/genre/domain/genre.repository';
import { overrideConfiguration } from '../../config-module/configuration';
import { Genre, GenreId } from '../../../core/genre/domain/genre.aggregate';
import { CustomKafkaServer } from '../../kafka-module/servers/custom-kafka-server';
import { KafkaModule } from '../../kafka-module/kafka.module';
import { CDCOperation, CDCPayloadDto } from '../../kafka-module/cdc.dto';
import { TestExceptionFilter } from '../../shared-module/test-exception-filter';
import { logLevel } from 'kafkajs';
import { NestMicroservice } from '@nestjs/microservices';
import { KConnectEventPatternRegister } from '../../kafka-module/kconnect-event-pattern-register';
import { sleep } from '../../../core/shared/infra/utils';
import { GenreSavedConsumerDto } from '../genre-saved-consumer.dto';
import { Category } from '../../../core/category/domain/category.aggregate';
import { ICategoryRepository } from '../../../core/category/domain/category.repository';
import { CATEGORY_PROVIDERS } from '../../categories-module/categories.providers';
import { NestedCategory } from '../../../core/category/domain/nested-category.entity';

describe('GenresConsumer Integration Tests', () => {
  const esHelper = setupElasticSearch();
  const kafkaHelper = setupKafka();

  let _nestModule: TestingModule;
  let _microserviceInst: NestMicroservice;
  let _kafkaServer: CustomKafkaServer;
  let _kafkaConnectPrefix;
  let _genresTopic;
  const _genresAggregateTopic = 'genres_aggregate';

  beforeEach(async () => {
    _kafkaConnectPrefix = 'test_prefix' + crypto.randomInt(0, 1000000);
    _genresTopic = KConnectEventPatternRegister.kConnectTopicName(
      _kafkaConnectPrefix,
      'genres',
    );

    _kafkaServer = new CustomKafkaServer({
      client: {
        clientId: 'test_client' + crypto.randomInt(0, 1000000),
        brokers: [kafkaHelper.kafkaContainerHost],
        connectionTimeout: 1000,
        logLevel: logLevel.DEBUG,
      },
      consumer: {
        allowAutoTopicCreation: false,
        groupId: 'test_group' + crypto.randomInt(0, 1000000),
        retry: {
          restartOnFailure: (e) => Promise.resolve(false),
        },
        maxWaitTimeInMs: 0,
      },
      subscribe: {
        fromBeginning: true,
      },
    });

    await Promise.all([
      kafkaHelper.kafkaContainer.createTopic(_genresTopic),
      kafkaHelper.kafkaContainer.createTopic(_genresAggregateTopic),
    ]);

    _nestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: esHelper.esUrl,
                index: esHelper.indexName,
              },
              kafka: {
                connect_prefix: _kafkaConnectPrefix,
              },
            }),
          ],
        }),
        KafkaModule,
        GenresModule,
        ElasticSearchModule,
      ],
    }).compile();

    await _nestModule
      .get(KConnectEventPatternRegister)
      .registerKConnectTopicDecorator();

    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: _kafkaServer,
    }) as NestMicroservice;
  });

  afterEach(async () => {
    await _microserviceInst.close();
    await Promise.all([
      kafkaHelper.kafkaContainer.deleteTopic(_genresTopic),
      kafkaHelper.kafkaContainer.deleteTopic(_genresAggregateTopic),
    ]);
  });

  describe('handleCreateAndUpdateEvents', () => {
    it('should create a genre', async () => {
      const category = Category.fake().aCategory().build();
      const categoryRepo = _microserviceInst.get<ICategoryRepository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      await categoryRepo.insert(category);

      await _microserviceInst.listen();
      const genreId = new GenreId();
      const message: GenreSavedConsumerDto = {
        genre_id: genreId.id,
        name: 'Comedy',
        categories_id: [category.category_id.id],
        is_active: true,
        created_at: '2021-09-01T00:00:00.000Z' as any,
        op: 'c',
      };
      await _kafkaServer['producer'].send({
        topic: 'genres_aggregate',
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      const repository = _microserviceInst.get<IGenreRepository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      const genre = await repository.findById(genreId);
      expect(genre).toBeDefined();
      expect(genre!.name).toEqual('Comedy');
      expect(genre!.categories).toEqual(
        new Map([
          [
            category.category_id.id,
            NestedCategory.create({
              category_id: category.category_id,
              name: category.name,
              is_active: true,
            }),
          ],
        ]),
      );
      expect(genre!.is_active).toEqual(true);
      expect(genre!.created_at).toEqual(new Date('2021-09-01T00:00:00.000Z'));
    });

    it('should update a genre', async () => {
      const category = Category.fake().aCategory().build();
      const categoryRepo = _microserviceInst.get<ICategoryRepository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      await categoryRepo.insert(category);
      const genreRepo = _microserviceInst.get<IGenreRepository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);

      await _microserviceInst.listen();
      const message: GenreSavedConsumerDto = {
        genre_id: genre.genre_id.id,
        name: 'Comedy',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: '2021-09-01T00:00:00.000Z' as any,
        op: 'u',
      };
      await _kafkaServer['producer'].send({
        topic: 'genres_aggregate',
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      const updatedGenre = await genreRepo.findById(genre.genre_id);
      expect(updatedGenre).toBeDefined();
      expect(updatedGenre!.name).toEqual('Comedy');
      expect(updatedGenre!.categories).toEqual(
        new Map([
          [
            category.category_id.id,
            NestedCategory.create({
              category_id: category.category_id,
              name: category.name,
              is_active: true,
            }),
          ],
        ]),
      );
      expect(updatedGenre!.is_active).toEqual(false);
      expect(updatedGenre!.created_at).toEqual(
        new Date('2021-09-01T00:00:00.000Z'),
      );
    });
  });

  describe('handleKConnectEvents', () => {
    it('should throw an validation exception when event is invalid', async () => {
      expect.assertions(2);
      const exceptionFilterClass = TestExceptionFilter.createExceptionFilter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (exception, _host) => {
          const error = exception as BadRequestException;
          expect(error).toBeInstanceOf(BadRequestException);
          //@ts-expect-error - error.getResponse is a object
          const message = error.getResponse().message;
          expect(message).toEqual([
            'op should not be empty',
            'op must be one of the following values: r, c, u, d',
            'after must be an object',
            'before must be an object',
          ]);
        },
      );

      _microserviceInst.useGlobalFilters(new exceptionFilterClass());
      await _microserviceInst.listen();
      const message = {};
      await _kafkaServer['producer'].send({
        topic: _genresTopic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
        timeout: 1000,
      });

      await sleep(1000);
    });

    test('should delete a genre', async () => {
      const repository = _microserviceInst.get<IGenreRepository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      const genre = Genre.fake().aGenre().build();
      await repository.insert(genre);

      await _microserviceInst.listen();
      const message: CDCPayloadDto = {
        op: CDCOperation.DELETE,
        before: {
          id: genre.genre_id.id,
        },
        after: null,
      };
      await _kafkaServer['producer'].send({
        topic: _genresTopic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      expect(repository.findById(genre.genre_id)).resolves.toBeNull();
    });
  });
});
