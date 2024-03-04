import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { overrideConfiguration } from './configuration';

describe('ConfigModule', () => {
  it('should be define variable', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
    }).compile();

    const configService = moduleRef.get<ConfigService>(ConfigService);
    expect(configService.get('elastic_search.host')).toBeDefined();
    expect(configService.get('elastic_search.index')).toBeDefined();
  });

  it('should be define variable with override', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            overrideConfiguration({ elastic_search: { host: 'localhost' } }),
          ],
        }),
      ],
    }).compile();

    const configService = moduleRef.get<ConfigService>(ConfigService);
    expect(configService.get('elastic_search.host')).toBe('localhost');
    expect(configService.get('elastic_search.index')).toBeDefined();
  });
});
