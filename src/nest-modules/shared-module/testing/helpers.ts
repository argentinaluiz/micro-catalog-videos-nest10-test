import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule, appConfigurationModule } from '../../../app.module';
import { applyGlobalConfig } from '../global-config';
import { setupElasticSearch } from '../../../core/shared/infra/testing/helpers';
import { ConfigModule } from '../../config-module/config.module';
import { overrideConfiguration } from '../../config-module/configuration';
export function startApp() {
  let _app: INestApplication;

  const esHelper = setupElasticSearch();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(appConfigurationModule)
      .useModule(
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: esHelper.esUrl,
                index: esHelper.indexName,
              },
            }),
          ],
        }),
      )
      .compile();

    _app = moduleFixture.createNestApplication();
    applyGlobalConfig(_app);
    await _app.init();
  });

  afterEach(async () => {
    await _app?.close();
  });

  return {
    get app() {
      return _app;
    },
  };
}
