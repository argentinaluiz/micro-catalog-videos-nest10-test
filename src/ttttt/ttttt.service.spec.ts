import { Test, TestingModule } from '@nestjs/testing';
import { TttttService } from './ttttt.service';

describe('TttttService', () => {
  let service: TttttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TttttService],
    }).compile();

    service = module.get<TttttService>(TttttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
