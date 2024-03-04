import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { HttpWaitStrategy } from 'testcontainers/build/wait-strategies/http-wait-strategy';
import mysql from 'mysql2/promise';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesModule } from '../categories.module';
import { ConfigModule } from '../../config-module/config.module';
import { ElasticSearchModule } from '../../elastic-search-module/elastic-search.module';
import { setupElasticSearch } from '../../../core/shared/infra/testing/helpers';
import crypto from 'crypto';
import { INestMicroservice } from '@nestjs/common';
import { CATEGORY_PROVIDERS } from '../categories.providers';
import { ICategoryRepository } from '../../../core/category/domain/category.repository';
import { overrideConfiguration } from '../../config-module/configuration';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { CategoryId } from '../../../core/category/domain/category.aggregate';
import { CustomKafkaServer } from '../../kafka-module/servers/custom-kafka-server';
import { KafkaModule } from '../../kafka-module/kafka.module';
describe.skip('CategoriesConsumer Integration Tests', () => {
  const esHelper = setupElasticSearch();

  let _kafkaContainer: StartedKafkaContainer;
  let _mysqlContainer: StartedMySqlContainer;
  let _mysqlDbName;
  let _mysqlConnection;
  let _schemaRegistryContainer: StartedTestContainer;
  let _kafkaConnect: StartedTestContainer;
  let _kConnectorName;
  let _nestModule: TestingModule;
  let _microserviceInst: INestMicroservice;
  let _kafkaServer: CustomKafkaServer;

  beforeAll(
    async () => {
      const containers = await Promise.all([
        new KafkaContainer('confluentinc/cp-kafka:7.5.2')
          .withReuse()
          .withExposedPorts({
            container: 9092,
            host: 9093,
          })
          .start(),
        new MySqlContainer('mysql:8.0.30-debian')
          .withReuse()
          .withCommand([
            '--default-authentication-plugin=mysql_native_password',
            '--server-id=1',
            '--log-bin=mysql-bin',
          ])
          .withTmpFs({ '/var/lib/mysql': 'rw' })
          .withRootPassword('root')
          .withExposedPorts({
            container: 3306,
            host: 3307,
          })
          .start(),
      ]);
      _kafkaContainer = containers[0];
      _mysqlContainer = containers[1];
      _schemaRegistryContainer = await new GenericContainer(
        'confluentinc/cp-schema-registry:7.5.2',
      )
        .withReuse()
        .withEnvironment({
          SCHEMA_REGISTRY_HOST_NAME: 'schema-registry',
          SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`,
          SCHEMA_REGISTRY_LISTENERS: 'http://0.0.0.0:8081',
        })
        .withExposedPorts({
          container: 8081,
          host: 8082,
        })
        .start();
      _kafkaConnect = await new GenericContainer(
        'cnfldemos/cp-server-connect-datagen:0.6.2-7.5.0',
      )
        .withReuse()
        .withExposedPorts({
          container: 8083,
          host: 8084,
        })
        .withEnvironment({
          CONNECT_BOOTSTRAP_SERVERS: `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(
            9093,
          )}`,
          CONNECT_REST_ADVERTISED_HOST_NAME: 'connect',
          CONNECT_GROUP_ID: 'compose-connect-group',
          CONNECT_CONFIG_STORAGE_TOPIC: 'docker-connect-configs',
          CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR: '1',
          CONNECT_OFFSET_FLUSH_INTERVAL_MS: '10000',
          CONNECT_OFFSET_STORAGE_TOPIC: 'docker-connect-offsets',
          CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR: '1',
          CONNECT_STATUS_STORAGE_TOPIC: 'docker-connect-status',
          CONNECT_STATUS_STORAGE_REPLICATION_FACTOR: '1',
          CONNECT_KEY_CONVERTER:
            'org.apache.kafka.connect.storage.StringConverter',
          CONNECT_VALUE_CONVERTER: 'io.confluent.connect.avro.AvroConverter',
          CONNECT_VALUE_CONVERTER_SCHEMA_REGISTRY_URL: `http://${_schemaRegistryContainer.getHost()}:${_schemaRegistryContainer.getMappedPort(
            8081,
          )}`,
          CLASSPATH:
            '/usr/share/java/monitoring-interceptors/monitoring-interceptors-7.5.2.jar',
          CONNECT_PRODUCER_INTERCEPTOR_CLASSES:
            'io.confluent.monitoring.clients.interceptor.MonitoringProducerInterceptor',
          CONNECT_CONSUMER_INTERCEPTOR_CLASSES:
            'io.confluent.monitoring.clients.interceptor.MonitoringConsumerInterceptor',
          CONNECT_PLUGIN_PATH:
            '/usr/share/java,/usr/share/confluent-hub-components',
          CONNECT_LOG4J_LOGGERS:
            'org.apache.zookeeper=ERROR,org.I0Itec.zkclient=ERROR,org.reflections=ERROR',
        })
        .withCommand([
          'bash',
          '-c',
          'confluent-hub install --no-prompt debezium/debezium-connector-mysql:2.2.1 && /etc/confluent/docker/run && sleep infinity',
        ])
        .withWaitStrategy(
          new HttpWaitStrategy('/connectors', 8083, {}).withStartupTimeout(
            120000,
          ),
        )
        .start();
    },
    1000 * 60 * 5,
  );

  beforeEach(async () => {
    _mysqlDbName = 'test_db_' + crypto.randomInt(0, 1000000);

    _mysqlConnection = await mysql.createConnection({
      host: _mysqlContainer.getHost(),
      port: _mysqlContainer.getPort(),
      user: 'root',
      password: _mysqlContainer.getRootPassword(),
      multipleStatements: true,
    });
    await _mysqlConnection.query(`
    CREATE DATABASE ${_mysqlDbName};
    use ${_mysqlDbName};
    CREATE TABLE IF NOT EXISTS categories (id VARCHAR(36), name VARCHAR(255), description TEXT, is_active BOOLEAN, created_at DATETIME);
    `);

    _kConnectorName = 'test_kconnector_' + crypto.randomInt(0, 1000000);

    const responseKConnectCreateConfig = await fetch(
      `http://${_kafkaConnect.getHost()}:${_kafkaConnect.getMappedPort(
        8083,
      )}/connectors`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: _kConnectorName,
          config: {
            'connector.class': 'io.debezium.connector.mysql.MySqlConnector',
            'tasks.max': '1',
            'topic.prefix': 'mysql',
            'database.hostname': _mysqlContainer.getHost(),
            'database.port': _mysqlContainer.getPort(),
            'database.user': 'root',
            'database.password': _mysqlContainer.getRootPassword(),
            'database.server.id': '1',
            'provide.transaction.metadata': 'true',
            'database.server.name': 'mysql-server',
            'schema.history.internal.kafka.bootstrap.servers': `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(
              9093,
            )}`,
            'schema.history.internal.kafka.topic': 'mysql_history',
            'database.whitelist': _mysqlDbName,
          },
        }),
      },
    );
    if (responseKConnectCreateConfig.status !== 201) {
      throw new Error(await responseKConnectCreateConfig.text());
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const responseKConnectCheckStatus = await fetch(
      `http://${_kafkaConnect.getHost()}:${_kafkaConnect.getMappedPort(
        8083,
      )}/connectors/${_kConnectorName}/status`,
    );
    if (responseKConnectCheckStatus.status !== 200) {
      throw new Error(await responseKConnectCheckStatus.text());
    }

    const data = await responseKConnectCheckStatus.json();
    if (data.tasks[0].state !== 'RUNNING') {
      throw new Error(data);
    }

    _nestModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: `http://${esHelper.container.getHost()}:${esHelper.container.getMappedPort(9200)}`,
                index: esHelper.indexName,
              },
              kafka: {
                connect_prefix: `mysql.${_mysqlDbName}`,
              },
            }),
          ],
        }),
        DiscoveryModule,
        KafkaModule,
        CategoriesModule,
        ElasticSearchModule,
      ],
    }).compile();

    _kafkaServer = new CustomKafkaServer({
      schemaRegistry: new SchemaRegistry({
        host: `http://${_schemaRegistryContainer.getHost()}:${_schemaRegistryContainer.getMappedPort(8081)}`,
      }),
      client: {
        clientId: 'test_client' + crypto.randomInt(0, 1000000),
        brokers: [
          `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`,
        ],
        connectionTimeout: 1000,
      },
      consumer: {
        allowAutoTopicCreation: false,
        groupId: _kConnectorName,
        retry: {
          restartOnFailure: (e) => Promise.resolve(false),
        },
        maxWaitTimeInMs: 0,
      },
      subscribe: {
        fromBeginning: true,
      },
    });
  });

  afterEach(async () => {
    if (_kafkaConnect) {
      const responseKConnectDelete = await fetch(
        `http://${_kafkaConnect.getHost()}:${_kafkaConnect.getMappedPort(
          8083,
        )}/connectors/${_kConnectorName}`,
        {
          method: 'DELETE',
        },
      );
      if (responseKConnectDelete.status !== 204) {
        throw new Error(await responseKConnectDelete.text());
      }
    }
    if (_mysqlContainer && _mysqlDbName && _mysqlConnection) {
      await _mysqlConnection.query(`DROP DATABASE ${_mysqlDbName}`);
      await _mysqlConnection.end();
    }
    await _microserviceInst.close();
  });

  test('should sync a category', async () => {
    const categoryId = new CategoryId(crypto.randomUUID());

    await _mysqlConnection.query(`
    use ${_mysqlDbName};
    INSERT INTO categories (id, name, description, is_active, created_at) VALUES ("${categoryId}", "name", "description", true, "2021-01-01T00:00:00");
    `);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(1000);

    //iniciar no teste para deixar o tópico do sink do connect ser criado antes da criação automático do Nest.js
    //senão vai lançar erro de tópico sem líder
    _microserviceInst = _nestModule.createNestMicroservice({
      strategy: _kafkaServer,
    });
    await _microserviceInst.init();
    await _microserviceInst.listen();

    const repository = _microserviceInst.get<ICategoryRepository>(
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    );

    await sleep(2000);
    const category = await repository.findById(categoryId);
    expect(category).toBeDefined();
    expect(category!.name).toEqual('name');
    expect(category!.description).toEqual('description');
    expect(category!.is_active).toEqual(true);
    expect(category!.created_at).toEqual(new Date('2021-01-01T00:00:00'));
  });
});
