import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ElasticsearchContainer,
  StartedElasticsearchContainer,
} from '@testcontainers/elasticsearch';
import { esMapping } from '../db/elastic-search/es-mapping';
import debug from 'debug';
import crypto from 'crypto';
import {
  CustomKafkaContainer,
  CustomStartedKafkaContainer,
} from './containers/custom-kafka-container';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

function tryStartContainer<T>(fn: () => Promise<T>): Promise<T> {
  do {
    try {
      return fn();
    } catch (e) {
      if (!e.message.includes('port is already allocated')) {
        throw e;
      }
    }
  } while (true);
}

type SetupElasticSearchHelper = {
  deleteIndex: boolean;
};

const esDebug = debug('eshelper');
export function setupElasticSearch(
  options: SetupElasticSearchHelper = { deleteIndex: true },
) {
  let _container: StartedElasticsearchContainer;
  let _indexName;
  let _esClient: ElasticsearchService;

  beforeAll(async () => {
    _container = await tryStartContainer(async () => {
      return new ElasticsearchContainer('elasticsearch:7.17.7')
        .withReuse()
        .withTmpFs({
          '/usr/share/elasticsearch/data': 'rw',
        })
        .withExposedPorts({
          container: 9200,
          host: 9300,
        })
        .start();
    });
    _esClient = new ElasticsearchService({
      node: _container.getHttpUrl(),
    });
  }, 20000);

  beforeEach(async () => {
    _indexName = 'test_es_' + crypto.randomInt(0, 1000000);
    esDebug('indexName: %s', _indexName);
    await _esClient?.indices.create({
      index: _indexName,
      body: {
        mappings: esMapping,
      },
    });
  });

  afterEach(async () => {
    if (!options.deleteIndex) {
      return;
    }
    await _esClient?.indices?.delete({ index: _indexName });
  });

  return {
    get esClient() {
      return _esClient;
    },
    get indexName() {
      return _indexName;
    },
    get container() {
      return _container;
    },
    get esUrl() {
      return _container.getHttpUrl();
    },
  };
}

type SetupKafkaHelper = {
  schemaRegistry?: boolean;
  topics?: string[];
};

export function setupKafka(
  options: SetupKafkaHelper = { schemaRegistry: false, topics: [] },
) {
  let _kafkaContainer: CustomStartedKafkaContainer;
  let _schemaRegistryContainer: StartedTestContainer | null = null;

  beforeAll(async () => {
    _kafkaContainer = await tryStartContainer(async () => {
      return await new CustomKafkaContainer('confluentinc/cp-kafka:7.5.2')
        .withReuse()
        .withExposedPorts({
          container: 9092,
          host: 9093,
        })
        .start();
    });
    if (options.schemaRegistry) {
      _schemaRegistryContainer = await tryStartContainer(async () => {
        return await new GenericContainer(
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
      });
    }
  }, 40000);

  beforeEach(async () => {
    if (options.topics?.length) {
      await Promise.all(
        options.topics.map((topic) => _kafkaContainer.createTopic(topic)),
      );
    }
  });

  afterEach(async () => {
    if (options.topics?.length) {
      await Promise.all(
        options.topics.map((topic) => _kafkaContainer.deleteTopic(topic)),
      );
    }
  });

  return {
    get kafkaContainer() {
      return _kafkaContainer;
    },
    get kafkaContainerHost() {
      return `${_kafkaContainer.getHost()}:${_kafkaContainer.getMappedPort(9093)}`;
    },
    get schemaRegistryContainer() {
      return _schemaRegistryContainer;
    },
    get schemaRegistryUrl() {
      return `http://${_schemaRegistryContainer?.getHost()}:${_schemaRegistryContainer?.getMappedPort(8081)}`;
    },
  };
}
