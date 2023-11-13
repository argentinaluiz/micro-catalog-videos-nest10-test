import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchContainer } from '@testcontainers/elasticsearch';
import { esMapping } from '../db/elastic-search/es-mapping';
import debug from 'debug';
import crypto from 'crypto';
const esDebug = debug('eshelper');

type ElasticSearchHelper = {
  deleteIndex: boolean;
};

export function elasticSearchHelper(
  options: ElasticSearchHelper = { deleteIndex: true },
) {
  let _container;
  let _indexName;
  let _esClient: ElasticsearchService;

  beforeAll(async () => {
    _container = await new ElasticsearchContainer('elasticsearch:7.17.7')
      .withReuse()
      .withTmpFs({
        '/usr/share/elasticsearch/data': 'rw',
      })
      .withExposedPorts({
        container: 9200,
        host: 9200,
      })
      .start();
    _esClient = new ElasticsearchService({
      node: _container.getHttpUrl(),
    });
  }, 20000);

  beforeEach(async () => {
    _indexName = 'test_' + crypto.randomInt(0, 1000000);
    esDebug('indexName: %s', _indexName);
    await _esClient.indices.create({
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
    await _esClient.indices.delete({ index: _indexName });
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
  };
}
