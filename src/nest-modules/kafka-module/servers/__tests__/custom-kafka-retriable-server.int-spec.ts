import { logLevel } from 'kafkajs';
import crypto from 'crypto';
import {
  Controller,
  INestMicroservice,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RetryTopicNaming } from 'kafkajs-async-retry';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { CustomKafkaRetriableErrorFilter } from '../../error-filters/custom-kafka-retriable-error.filter';
import { setupKafka } from '../../../../core/shared/infra/testing/helpers';
import { CustomKafkaRetriableServer } from '../custom-kafka-retriable-server';
import { sleep } from '../../../../core/shared/infra/utils';

const _topic = 'retry-topic';
const _groupIdPrefix = 'test_group';
const createConsumerClass = (groupId) => {
  @Controller()
  class StubConsumer {
    static spyConsumerMessage = jest.fn();
    static spyConsumerDlqMessage = jest.fn();

    @EventPattern(_topic)
    async consume(@Payload() msg, @Ctx() context: KafkaContext) {
      StubConsumer.spyConsumerMessage(msg, context);
      throw new Error('test error');
    }

    @EventPattern(`${groupId}-server-dlq`)
    async consumeDlq(@Payload() msg, @Ctx() context: KafkaContext) {
      StubConsumer.spyConsumerDlqMessage(msg, context);
    }
  }

  return StubConsumer;
};

describe('CustomKafkaRetriableServer Integration Tests', () => {
  const kafkaHelper = setupKafka();

  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;
  let _kafkaServer: CustomKafkaRetriableServer;
  let _groupId: string;
  let _consumerClass;

  beforeEach(async () => {
    await kafkaHelper.kafkaContainer.createTopic(_topic);

    _groupId = _groupIdPrefix + crypto.randomInt(0, 1000000);
    _consumerClass = createConsumerClass(_groupId);
    _kafkaServer = new CustomKafkaRetriableServer({
      asyncRetryConfig: {
        retryDelays: [1],
        maxRetries: 3,
        maxWaitTime: 100000,
        retryTopicNaming: RetryTopicNaming.ATTEMPT_BASED,
      },
      client: {
        clientId: 'test_client' + crypto.randomInt(0, 1000000),
        brokers: [kafkaHelper.kafkaContainerHost],
        connectionTimeout: 1000,
        logLevel: logLevel.NOTHING,
      },
      consumer: {
        groupId: _groupId,
        retry: {
          restartOnFailure: (e) => Promise.resolve(false),
        },
        maxWaitTimeInMs: 0,
      },
      subscribe: {
        fromBeginning: true,
      },
    });

    _nestModule = await Test.createTestingModule({
      controllers: [_consumerClass],
    }).compile();

    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: _kafkaServer,
      logger: false,
    });

    _microserviceInst.useGlobalFilters(new CustomKafkaRetriableErrorFilter());

    await _microserviceInst.listen();
  });

  afterEach(async () => {
    await _microserviceInst.close();
    await kafkaHelper.kafkaContainer.deleteTopic(_topic);
    await kafkaHelper.kafkaContainer.deleteTopic(`${_groupIdPrefix}.*`);
  });

  it('should retry consuming', async () => {
    await _kafkaServer['producer'].send({
      topic: _topic,
      messages: [
        {
          key: 'key',
          value: Buffer.from('value'),
        },
      ],
    });

    await sleep(6000);

    expect(_consumerClass.spyConsumerMessage).toHaveBeenCalledTimes(4);
    const expectedTopics = [
      _topic,
      `${_groupId}-server-retry-1`,
      `${_groupId}-server-retry-2`,
      `${_groupId}-server-retry-3`,
    ];

    for (let i = 0; i < 4; i++) {
      expect(_consumerClass.spyConsumerMessage).toHaveBeenNthCalledWith(
        i + 1,
        'value',
        expect.objectContaining({
          getTopic: expect.any(Function),
        }),
      );
      expect(
        _consumerClass.spyConsumerMessage.mock.calls[i][1].getTopic(),
      ).toBe(expectedTopics[i]);
    }

    expect(_consumerClass.spyConsumerDlqMessage).toHaveBeenCalledTimes(1);
    expect(_consumerClass.spyConsumerDlqMessage).toHaveBeenCalledWith(
      'value',
      expect.objectContaining({
        getTopic: expect.any(Function),
      }),
    );
    expect(
      _consumerClass.spyConsumerDlqMessage.mock.calls[0][1].getTopic(),
    ).toBe(`${_groupId}-server-dlq`);
  }, 10000);

  it('should send message to dlq directly', async () => {
    _microserviceInst.useGlobalFilters(new CustomKafkaRetriableErrorFilter());
    _consumerClass.spyConsumerMessage.mockImplementationOnce(() => {
      throw new UnprocessableEntityException();
    });
    await _kafkaServer['producer'].send({
      topic: _topic,
      messages: [
        {
          key: 'key',
          value: Buffer.from('value'),
        },
      ],
    });

    await sleep(1500);

    expect(_consumerClass.spyConsumerMessage).toHaveBeenCalledTimes(1);
    expect(_consumerClass.spyConsumerDlqMessage).toHaveBeenCalledTimes(1);
    expect(_consumerClass.spyConsumerDlqMessage).toHaveBeenCalledWith(
      'value',
      expect.objectContaining({
        getTopic: expect.any(Function),
      }),
    );
    expect(
      _consumerClass.spyConsumerDlqMessage.mock.calls[0][1].getTopic(),
    ).toBe(`${_groupId}-server-dlq`);
  });
});
