import { Test, TestingModule } from '@nestjs/testing';
import { TttttResolver } from './ttttt.resolver';
import { TttttService } from './ttttt.service';

describe('TttttResolver', () => {
  let resolver: TttttResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TttttResolver, TttttService],
    }).compile();

    resolver = module.get<TttttResolver>(TttttResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
