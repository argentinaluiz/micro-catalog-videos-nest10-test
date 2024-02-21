import { Test, TestingModule } from '@nestjs/testing';
import { KafkaRetryController } from './kafka-retry.controller';

describe('KafkaRetryController', () => {
  let controller: KafkaRetryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KafkaRetryController],
    }).compile();

    controller = module.get<KafkaRetryController>(KafkaRetryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
