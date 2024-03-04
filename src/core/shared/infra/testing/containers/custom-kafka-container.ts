import { KafkaContainer, StartedKafkaContainer } from '@testcontainers/kafka';
import { ExecResult } from 'testcontainers';

export class CustomKafkaContainer extends KafkaContainer {
  async start(): Promise<CustomStartedKafkaContainer> {
    return new CustomStartedKafkaContainer(await super.start());
  }
}

export class CustomStartedKafkaContainer extends StartedKafkaContainer {
  createTopic(topic: string): Promise<ExecResult> {
    return this.exec([
      'kafka-topics',
      '--create',
      '--topic',
      topic,
      '--partitions',
      '1',
      '--replication-factor',
      '1',
      '--bootstrap-server',
      `localhost:9092`,
    ]);
  }

  deleteTopic(topic: string): Promise<ExecResult> {
    return this.exec([
      'kafka-topics',
      '--delete',
      '--topic',
      `'${topic}'`,
      '--bootstrap-server',
      `localhost:9092`,
    ]);
  }
}
