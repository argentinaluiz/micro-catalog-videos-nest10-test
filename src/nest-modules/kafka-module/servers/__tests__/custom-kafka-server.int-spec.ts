import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Controller, INestMicroservice } from '@nestjs/common';
import { logLevel } from 'kafkajs';
import { setupKafka } from '../../../../core/shared/infra/testing/helpers';
import { CustomKafkaServer } from '../custom-kafka-server';

const _topic = 'schematest';

@Controller()
class SchemaRegistryConsumer {
  static spyConsumer = jest.fn();
  @EventPattern(_topic)
  async consume(@Payload() msg) {
    SchemaRegistryConsumer.spyConsumer(msg);
  }
}

describe('CustomKafkaServer Integration Tests', () => {
  const kafkaHelper = setupKafka({
    schemaRegistry: true,
  });

  let _schemaRegistry: SchemaRegistry;
  let _schemaRegistryId: number;
  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;
  let _kafkaServer: CustomKafkaServer;

  beforeEach(async () => {
    await kafkaHelper.kafkaContainer.createTopic(_topic);
    _schemaRegistry = new SchemaRegistry({
      host: kafkaHelper.schemaRegistryUrl,
    });

    const response = await fetch(
      `${kafkaHelper.schemaRegistryUrl}/subjects/${_topic}-value/versions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.schemaregistry.v1+json',
        },
        body: JSON.stringify({
          schema: JSON.stringify({
            type: 'record',
            name: _topic,
            fields: [
              { name: 'operation', type: 'string' },
              { name: 'payload', type: 'string' },
            ],
          }),
        }),
      },
    );
    if (response.status !== 200) {
      throw new Error(await response.text());
    }
    _schemaRegistryId = (await response.json()).id;

    _kafkaServer = new CustomKafkaServer({
      schemaRegistry: _schemaRegistry,
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

    _nestModule = await Test.createTestingModule({
      controllers: [SchemaRegistryConsumer],
    }).compile();

    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: _kafkaServer,
    });
    await _microserviceInst.init();
    await _microserviceInst.listen();
  });

  afterEach(async () => {
    await _microserviceInst.close();
    await kafkaHelper.kafkaContainer.deleteTopic(_topic);
    const response = await fetch(
      `${kafkaHelper.schemaRegistryUrl}/subjects/${_topic}-value`,
      {
        method: 'DELETE',
      },
    );
    if (response.status !== 200) {
      throw new Error(await response.text());
    }
  });

  it('should consume using schema registry', async () => {
    await _kafkaServer['producer'].send({
      topic: _topic,
      messages: [
        {
          key: 'key',
          value: await _schemaRegistry.encode(_schemaRegistryId, {
            operation: 'op',
            payload: 'pay',
          }),
        },
      ],
    });

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(1000);

    expect(SchemaRegistryConsumer.spyConsumer).toHaveBeenCalledTimes(1);
    expect(SchemaRegistryConsumer.spyConsumer).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'op',
        payload: 'pay',
      }),
    );
  });
});
