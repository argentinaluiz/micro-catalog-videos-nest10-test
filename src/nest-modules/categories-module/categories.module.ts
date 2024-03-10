import { DynamicModule } from '@nestjs/common';
import { CATEGORY_PROVIDERS } from './categories.providers';
import { CategoriesConsumer } from './categories.consumer';

export class CategoriesModule {
  static forRoot(): DynamicModule {
    return {
      module: CategoriesModule,
      controllers: [CategoriesConsumer],
      providers: [
        ...Object.values(CATEGORY_PROVIDERS.REPOSITORIES),
        ...Object.values(CATEGORY_PROVIDERS.USE_CASES),
      ],
      exports: [CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: CategoriesModule,
      providers: [
        ...Object.values(CATEGORY_PROVIDERS.REPOSITORIES),
        ...Object.values(CATEGORY_PROVIDERS.USE_CASES),
      ],
      exports: [CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide],
    };
  }
}
