import { ElasticsearchContainer, StartedElasticsearchContainer } from '@testcontainers/elasticsearch';

describe('elastic', () => {
  let container;
  beforeEach(async () => {
    container  = await new ElasticsearchContainer('elasticsearch:7.17.7')
      .withReuse()
      .withTmpFs({
        '/usr/share/elasticsearch/data': 'rw',
      })
      .start();
  }, 1000000);

  afterEach(async () => {
    //await container?.stop();
  });

  test('e1', async () => {});
  test('e2', async () => {});
  test('e3', async () => {});
  test('e4', async () => {});
  test('e5', async () => {});
  test('e6', async () => {});
  test('e7', async () => {});
});
