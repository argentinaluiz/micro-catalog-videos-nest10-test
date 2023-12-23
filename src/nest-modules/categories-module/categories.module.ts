import { Module } from '@nestjs/common';
import { CATEGORY_PROVIDERS } from './categories.providers';
@Module({
  providers: [
    ...Object.values(CATEGORY_PROVIDERS.REPOSITORIES),
    ...Object.values(CATEGORY_PROVIDERS.USE_CASES),
  ],
  exports: [CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide],
})
export class CategoriesModule {}
