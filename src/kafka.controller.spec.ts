import { KafkaContainer } from '@testcontainers/kafka';

describe('test kafka', () => {
  beforeAll(async () => {
    const kafkaContainer = await new KafkaContainer().withReuse().start();
  }, 30000);

  test('test kafka', async () => {
    console.log('aaaaa');
  });
});
