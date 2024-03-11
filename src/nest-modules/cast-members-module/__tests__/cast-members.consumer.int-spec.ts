import { Test, TestingModule } from '@nestjs/testing';
import { CastMembersModule } from '../cast-members.module';
import { ConfigModule } from '../../config-module/config.module';
import { ElasticSearchModule } from '../../elastic-search-module/elastic-search.module';
import {
  setupElasticSearch,
  setupKafka,
} from '../../../core/shared/infra/testing/helpers';
import crypto from 'crypto';
import { BadRequestException, INestMicroservice } from '@nestjs/common';
import { CAST_MEMBER_PROVIDERS } from '../cast-members.providers';
import { ICastMemberRepository } from '../../../core/cast-member/domain/cast-member.repository';
import { overrideConfiguration } from '../../config-module/configuration';
import { CustomKafkaServer } from '../../kafka-module/servers/custom-kafka-server';
import { KafkaModule } from '../../kafka-module/kafka.module';
import { CDCOperation, CDCPayloadDto } from '../../kafka-module/cdc.dto';
import { TestExceptionFilter } from '../../shared-module/test-exception-filter';
import { logLevel } from 'kafkajs';
import { KConnectEventPatternRegister } from '../../kafka-module/kconnect-event-pattern-register';
import { sleep } from '../../../core/shared/infra/utils';
import {
  CastMemberType,
  CastMemberTypes,
} from '../../../core/cast-member/domain/cast-member-type.vo';
import {
  CastMember,
  CastMemberId,
} from '../../../core/cast-member/domain/cast-member.aggregate';
describe('CastMembersConsumer Integration Tests', () => {
  const esHelper = setupElasticSearch();
  const kafkaHelper = setupKafka();

  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;
  let _kafkaServer: CustomKafkaServer;
  let _kafkaConnectPrefix;
  let _castMembersTopic;

  beforeEach(async () => {
    _kafkaConnectPrefix = 'test_prefix' + crypto.randomInt(0, 1000000);
    _castMembersTopic = KConnectEventPatternRegister.kConnectTopicName(
      _kafkaConnectPrefix,
      'cast_members',
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

    await kafkaHelper.kafkaContainer.createTopic(_castMembersTopic);
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
        CastMembersModule.forRoot(),
        ElasticSearchModule,
      ],
    }).compile();

    await _nestModule
      .get(KConnectEventPatternRegister)
      .registerKConnectTopicDecorator();

    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: _kafkaServer,
    });
  });

  afterEach(async () => {
    await _microserviceInst.close();
    await kafkaHelper.kafkaContainer.deleteTopic(_castMembersTopic);
  });

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
      topic: _castMembersTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
      timeout: 1000,
    });

    await sleep(1000);
  });

  test('should create a cast member', async () => {
    const castMemberId = new CastMemberId();

    const message: CDCPayloadDto = {
      op: CDCOperation.CREATE,
      before: null,
      after: {
        id: castMemberId.id,
        name: 'name',
        type: CastMemberTypes.ACTOR,
        created_at: '2021-01-01T00:00:00',
      },
    };

    //iniciar no teste para deixar o tópico do sink do connect ser criado antes da criação automático do Nest.js
    //senão vai lançar erro de tópico sem líder
    await _microserviceInst.listen();
    await _kafkaServer['producer'].send({
      topic: _castMembersTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(1000);

    const repository = _microserviceInst.get<ICastMemberRepository>(
      CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
    );

    const castMember = await repository.findById(castMemberId);
    expect(castMember).toBeDefined();
    expect(castMember!.name).toEqual('name');
    expect(castMember!.type).toEqual(CastMemberType.createAnActor());
    expect(castMember!.created_at).toEqual(new Date('2021-01-01T00:00:00'));
  });

  test('should update a cast member', async () => {
    const castMember = CastMember.fake().anActor().build();
    const repository = _microserviceInst.get<ICastMemberRepository>(
      CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
    );
    await repository.insert(castMember);

    const message: CDCPayloadDto = {
      op: CDCOperation.UPDATE,
      before: null,
      after: {
        id: castMember.cast_member_id.id,
        name: 'name',
        type: CastMemberTypes.DIRECTOR,
        created_at: '2021-01-01T00:00:00',
      },
    };

    await _microserviceInst.listen();
    _kafkaServer['producer'].send({
      topic: _castMembersTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(1000);

    const updatedCastMember = await repository.findById(
      castMember.cast_member_id,
    );
    expect(updatedCastMember).toBeDefined();
    expect(updatedCastMember!.name).toEqual('name');
    expect(updatedCastMember!.type).toEqual(CastMemberType.createADirector());
    expect(updatedCastMember!.created_at).toEqual(
      new Date('2021-01-01T00:00:00'),
    );
  });

  test('should delete a cast member', async () => {
    const castMember = CastMember.fake().anActor().build();
    const repository = _microserviceInst.get<ICastMemberRepository>(
      CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
    );
    await repository.insert(castMember);

    const message: CDCPayloadDto = {
      op: CDCOperation.DELETE,
      before: {
        id: castMember.cast_member_id.id,
      },
      after: null,
    };

    await _microserviceInst.listen();
    await _kafkaServer['producer'].send({
      topic: _castMembersTopic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await sleep(1000);

    await expect(
      repository.findById(castMember.cast_member_id),
    ).resolves.toBeNull();
  });
});
