import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import {
  GenericContainer,
  Network,
  StartedTestContainer,
} from 'testcontainers';
import { HttpWaitStrategy } from 'testcontainers/build/wait-strategies/http-wait-strategy';
import mysql from 'mysql2/promise';
import { Test } from '@nestjs/testing';
import { CategoriesModule } from '../categories.module';
import { ConfigModule } from '../../config-module/config.module';
import { ElasticSearchModule } from '../../elastic-search-module/elastic-search.module';
import { setupElasticSearch } from '../../../core/shared/infra/testing/helpers';
import { ConfigService } from '@nestjs/config';

describe('SaveCategoryUseCase Integration Tests', () => {
  const esHelper = setupElasticSearch();

  let _kafkaContainer: StartedKafkaContainer;
  let _mysqlContainer: StartedMySqlContainer;
  let _kafkaConnect: StartedTestContainer;
  let _network;
  beforeAll(async () => {
    _network = await new Network().start();
    _kafkaContainer = await new KafkaContainer('confluentinc/cp-kafka:7.5.2')
      .withReuse()
      .withNetwork(_network)
      .start();
    _mysqlContainer = await new MySqlContainer('mysql:8.0.30-debian')
      .withReuse()
      .withNetwork(_network)
      .withTmpFs({ '/var/lib/mysql': 'rw' })
      .start();
    _kafkaConnect = await new GenericContainer('debezium/connect:2.4.1.Final')
      .withReuse()
      .withNetwork(_network)
      .withExposedPorts(8083)
      .withEnvironment({
        BOOTSTRAP_SERVERS: `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(
          9093,
        )}`,
        GROUP_ID: '1',
        CONFIG_STORAGE_TOPIC: 'debezium_connect_config',
        OFFSET_STORAGE_TOPIC: 'debezium_connect_offsets',
        STATUS_STORAGE_TOPIC: 'debezium_connect_status',
        CONNECT_KEY_CONVERTER_SCHEMAS_ENABLE: 'false',
        CONNECT_VALUE_CONVERTER_SCHEMAS_ENABLE: 'false',
      })
      .withWaitStrategy(
        new HttpWaitStrategy('/connectors', 8083).withStartupTimeout(60000),
      )
      .start();
    let response = await fetch(
      `http://${_kafkaConnect.getHost()}:${_kafkaConnect.getMappedPort(
        8083,
      )}/connectors/mysql-connector/config`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          'database.whitelist': _mysqlContainer.getDatabase(),
        }),
      },
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(await response.text());
    }
    response = await fetch(
      `http://${_kafkaConnect.getHost()}:${_kafkaConnect.getMappedPort(
        8083,
      )}/connectors/mysql-connector/status`,
    );
    if (response.status !== 200) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    if (data.tasks[0].state !== 'RUNNING') {
      throw new Error(data);
    }
  }, 100000);

  test('xpto', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ELASTIC_SEARCH_INDEX: esHelper.indexName,
            }),
          ],
        }),
        ElasticSearchModule,
        CategoriesModule,
      ],
    }).compile();

    // const connection = await mysql.createConnection({
    //   host: _mysqlContainer.getHost(),
    //   user: 'root',
    //   password: _mysqlContainer.getRootPassword(),
    //   database: 'test',
    // });
    // await connection.query(
    //   'CREATE TABLE IF NOT EXISTS categories (id INT, name VARCHAR(255), description TEXT, is_active BOOLEAN, created_at DATETIME)',
    // );
    // await connection.query(
    //   'INSERT INTO categories (id, name, description, is_active, created_at) VALUES (1, "name", "description", true, 2021-01-01T00:00:00)',
    // );
  });
  // beforeEach(async () => {
  //   _indexName = 'test_' + crypto.randomInt(0, 1000000);
  //   esDebug('indexName: %s', _indexName);
  //   await _esClient.indices.create({
  //     index: _indexName,
  //     body: {
  //       mappings: esMapping,
  //     },
  //   });
  // });

  // afterEach(async () => {
  //   await _network.stop();
  //   if (!options.deleteIndex) {
  //     return;
  //   }
  //   await _esClient.indices?.delete({ index: _indexName });
  // });
});
