import { DynamicModule } from '@nestjs/common';
import { GENRE_PROVIDERS } from './genres.providers';
import { GenresConsumer } from './genres.consumer';
import { CategoriesModule } from '../categories-module/categories.module';

export class GenresModule {
  static forRoot(): DynamicModule {
    return {
      module: GenresModule,
      imports: [CategoriesModule.forFeature()],
      controllers: [GenresConsumer],
      providers: [
        ...Object.values(GENRE_PROVIDERS.REPOSITORIES),
        ...Object.values(GENRE_PROVIDERS.USE_CASES),
      ],
      exports: [GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: GenresModule,
      imports: [CategoriesModule.forFeature()],
      providers: [
        ...Object.values(GENRE_PROVIDERS.REPOSITORIES),
        ...Object.values(GENRE_PROVIDERS.USE_CASES),
      ],
      exports: [GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide],
    };
  }
}
