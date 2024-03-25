import { Test, TestingModule } from '@nestjs/testing';
import { VideosModule } from '../videos.module';
import { ConfigModule } from '../../config-module/config.module';
import { ElasticSearchModule } from '../../elastic-search-module/elastic-search.module';
import {
  setupElasticSearch,
  setupKafka,
} from '../../../core/shared/infra/testing/helpers';
import crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { VIDEO_PROVIDERS } from '../videos.providers';
import { IVideoRepository } from '../../../core/video/domain/video.repository';
import { overrideConfiguration } from '../../config-module/configuration';
import { Video, VideoId } from '../../../core/video/domain/video.aggregate';
import { CustomKafkaServer } from '../../kafka-module/servers/custom-kafka-server';
import { KafkaModule } from '../../kafka-module/kafka.module';
import { CDCOperation, CDCPayloadDto } from '../../kafka-module/cdc.dto';
import { TestExceptionFilter } from '../../shared-module/test-exception-filter';
import { logLevel } from 'kafkajs';
import { NestMicroservice } from '@nestjs/microservices';
import { KConnectEventPatternRegister } from '../../kafka-module/kconnect-event-pattern-register';
import { sleep } from '../../../core/shared/infra/utils';
import { VideoSavedConsumerDto } from '../video-saved-consumer.dto';
import { Category } from '../../../core/category/domain/category.aggregate';
import { ICategoryRepository } from '../../../core/category/domain/category.repository';
import { CATEGORY_PROVIDERS } from '../../categories-module/categories.providers';
import { NestedCategory } from '../../../core/category/domain/nested-category.entity';
import { IGenreRepository } from '../../../core/genre/domain/genre.repository';
import { GENRE_PROVIDERS } from '../../genres-module/genres.providers';
import { ICastMemberRepository } from '../../../core/cast-member/domain/cast-member.repository';
import { CAST_MEMBER_PROVIDERS } from '../../cast-members-module/cast-members.providers';
import { CastMember } from '../../../core/cast-member/domain/cast-member.aggregate';
import { Genre } from '../../../core/genre/domain/genre.aggregate';
import { Rating, RatingValues } from '../../../core/video/domain/rating.vo';
import { NestedGenre } from '../../../core/genre/domain/nested-genre.entity';
import { NestedCastMember } from '../../../core/cast-member/domain/nested-cast-member.entity';

describe('VideosConsumer Integration Tests', () => {
  const esHelper = setupElasticSearch();
  const kafkaHelper = setupKafka();

  let _nestModule: TestingModule;
  let _microserviceInst: NestMicroservice;
  let _kafkaServer: CustomKafkaServer;
  let _kafkaConnectPrefix;
  let _videosTopic;
  const _videosAggregateTopic = 'videos_aggregate';

  beforeEach(async () => {
    _kafkaConnectPrefix = 'test_prefix' + crypto.randomInt(0, 1000000);
    _videosTopic = KConnectEventPatternRegister.kConnectTopicName(
      _kafkaConnectPrefix,
      'videos',
    );

    _kafkaServer = new CustomKafkaServer({
      client: {
        clientId: 'test_client' + crypto.randomInt(0, 1000000),
        brokers: [kafkaHelper.kafkaContainerHost],
        connectionTimeout: 1000,
        logLevel: logLevel.NOTHING,
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
      kafkaHelper.kafkaContainer.createTopic(_videosTopic),
      kafkaHelper.kafkaContainer.createTopic(_videosAggregateTopic),
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
        VideosModule,
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
      kafkaHelper.kafkaContainer.deleteTopic(_videosTopic),
      kafkaHelper.kafkaContainer.deleteTopic(_videosAggregateTopic),
    ]);
  });

  describe('handleCreateAndUpdateEvents', () => {
    it('should create a video', async () => {
      const category = Category.fake().aCategory().build();
      const categoryRepo = _microserviceInst.get<ICategoryRepository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      await categoryRepo.insert(category);

      const genre = Genre.fake().aGenre().build();
      const genreRepo = _microserviceInst.get<IGenreRepository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      await genreRepo.insert(genre);

      const castMember = CastMember.fake().aDirector().build();
      const castMemberRepo = _microserviceInst.get<ICastMemberRepository>(
        CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
      );
      await castMemberRepo.insert(castMember);

      await _microserviceInst.listen();
      const videoId = new VideoId();
      const message: VideoSavedConsumerDto = {
        video_id: videoId.id,
        title: 'Comedy',
        description: 'Comedy description',
        year_launched: 2021,
        duration: 120,
        rating: RatingValues.R10,
        is_opened: true,
        is_published: true,
        banner_url: 'http://banner.com',
        thumbnail_url: 'http://thumbnail.com',
        thumbnail_half_url: 'http://thumbnail_half.com',
        trailer_url: 'http://trailer.com',
        video_url: 'http://video.com',
        categories_id: [category.category_id.id],
        genres_id: [genre.genre_id.id],
        cast_members_id: [castMember.cast_member_id.id],
        created_at: '2021-09-01T00:00:00.000Z' as any,
        op: 'c',
      };
      await _kafkaServer['producer'].send({
        topic: 'videos_aggregate',
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      const repository = _microserviceInst.get<IVideoRepository>(
        VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide,
      );
      const video = await repository.findById(videoId);
      expect(video).toBeDefined();
      expect(video!.title).toEqual('Comedy');
      expect(video!.description).toEqual('Comedy description');
      expect(video!.year_launched).toEqual(2021);
      expect(video!.duration).toEqual(120);
      expect(video!.rating).toBeValueObject(Rating.create10());
      expect(video!.is_opened).toEqual(true);
      expect(video!.is_published).toEqual(true);
      expect(video!.banner_url).toEqual('http://banner.com');
      expect(video!.thumbnail_url).toEqual('http://thumbnail.com');
      expect(video!.thumbnail_half_url).toEqual('http://thumbnail_half.com');
      expect(video!.trailer_url).toEqual('http://trailer.com');
      expect(video!.video_url).toEqual('http://video.com');
      expect(video!.categories).toEqual(
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
      expect(video!.genres).toEqual(
        new Map([
          [
            genre.genre_id.id,
            NestedGenre.create({
              genre_id: genre.genre_id,
              name: genre.name,
              is_active: true,
            }),
          ],
        ]),
      );
      expect(video!.cast_members).toEqual(
        new Map([
          [
            castMember.cast_member_id.id,
            NestedCastMember.create({
              cast_member_id: castMember.cast_member_id,
              name: castMember.name,
              type: castMember.type,
            }),
          ],
        ]),
      );
      expect(video!.created_at).toEqual(new Date('2021-09-01T00:00:00.000Z'));
    });

    it('should update a video', async () => {
      const category = Category.fake().aCategory().build();
      const categoryRepo = _microserviceInst.get<ICategoryRepository>(
        CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );
      await categoryRepo.insert(category);

      const genre = Genre.fake().aGenre().build();
      const genreRepo = _microserviceInst.get<IGenreRepository>(
        GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      );
      await genreRepo.insert(genre);

      const castMember = CastMember.fake().aDirector().build();
      const castMemberRepo = _microserviceInst.get<ICastMemberRepository>(
        CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
      );
      await castMemberRepo.insert(castMember);

      const videoRepo = _microserviceInst.get<IVideoRepository>(
        VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide,
      );
      const video = Video.fake().aVideoWithAllMedias().build();
      await videoRepo.insert(video);

      await _microserviceInst.listen();
      const message: VideoSavedConsumerDto = {
        video_id: video.video_id.id,
        title: 'Comedy',
        description: 'Comedy description',
        year_launched: 2021,
        duration: 120,
        rating: RatingValues.R10,
        is_opened: true,
        is_published: true,
        banner_url: 'http://banner.com',
        thumbnail_url: 'http://thumbnail.com',
        thumbnail_half_url: 'http://thumbnail_half.com',
        trailer_url: 'http://trailer.com',
        video_url: 'http://video.com',
        categories_id: [category.category_id.id],
        genres_id: [genre.genre_id.id],
        cast_members_id: [castMember.cast_member_id.id],
        created_at: '2021-09-01T00:00:00.000Z' as any,
        op: 'u',
      };
      await _kafkaServer['producer'].send({
        topic: 'videos_aggregate',
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      const updatedVideo = await videoRepo.findById(video.video_id);
      expect(updatedVideo).toBeDefined();
      expect(updatedVideo!.title).toEqual('Comedy');
      expect(updatedVideo!.description).toEqual('Comedy description');
      expect(updatedVideo!.year_launched).toEqual(2021);
      expect(updatedVideo!.duration).toEqual(120);
      expect(updatedVideo!.rating).toBeValueObject(Rating.create10());
      expect(updatedVideo!.is_opened).toEqual(true);
      expect(updatedVideo!.is_published).toEqual(true);
      expect(updatedVideo!.banner_url).toEqual('http://banner.com');
      expect(updatedVideo!.thumbnail_url).toEqual('http://thumbnail.com');
      expect(updatedVideo!.thumbnail_half_url).toEqual(
        'http://thumbnail_half.com',
      );
      expect(updatedVideo!.trailer_url).toEqual('http://trailer.com');
      expect(updatedVideo!.video_url).toEqual('http://video.com');
      expect(updatedVideo!.categories).toEqual(
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
      expect(updatedVideo!.genres).toEqual(
        new Map([
          [
            genre.genre_id.id,
            NestedGenre.create({
              genre_id: genre.genre_id,
              name: genre.name,
              is_active: true,
            }),
          ],
        ]),
      );
      expect(updatedVideo!.cast_members).toEqual(
        new Map([
          [
            castMember.cast_member_id.id,
            NestedCastMember.create({
              cast_member_id: castMember.cast_member_id,
              name: castMember.name,
              type: castMember.type,
            }),
          ],
        ]),
      );
      expect(updatedVideo!.created_at).toEqual(
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
        topic: _videosTopic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
        timeout: 1000,
      });

      await sleep(1000);
    });

    test('should delete a video', async () => {
      const repository = _microserviceInst.get<IVideoRepository>(
        VIDEO_PROVIDERS.REPOSITORIES.VIDEO_REPOSITORY.provide,
      );
      const video = Video.fake().aVideoWithAllMedias().build();
      await repository.insert(video);

      await _microserviceInst.listen();
      const message: CDCPayloadDto = {
        op: CDCOperation.DELETE,
        before: {
          id: video.video_id.id,
        },
        after: null,
      };
      await _kafkaServer['producer'].send({
        topic: _videosTopic,
        messages: [
          {
            value: JSON.stringify(message),
          },
        ],
      });

      await sleep(1000);

      expect(repository.findById(video.video_id)).resolves.toBeNull();
    });
  });
});
