import { GenreInMemoryRepository } from '../../core/genre/infra/db/in-memory/genre-in-memory.repository';
import { DeleteGenreUseCase } from '../../core/genre/application/use-cases/delete-genre/delete-genre.use-case';
import { IGenreRepository } from '../../core/genre/domain/genre.repository';
import { GenreElasticSearchRepository } from '../../core/genre/infra/db/elastic-search/genre-elastic-search';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SaveGenreUseCase } from '../../core/genre/application/use-cases/save-genre/save-genre.use-case';
import { ICategoryRepository } from '../../core/category/domain/category.repository';
import { CATEGORY_PROVIDERS } from '../categories-module/categories.providers';

export const REPOSITORIES = {
  GENRE_REPOSITORY: {
    provide: 'GenreRepository',
    useExisting: GenreElasticSearchRepository,
  },
  GENRE_IN_MEMORY_REPOSITORY: {
    provide: GenreInMemoryRepository,
    useClass: GenreInMemoryRepository,
  },
  GENRE_ELASTIC_SEARCH_REPOSITORY: {
    provide: GenreElasticSearchRepository,
    useFactory: (elasticSearchService: ElasticsearchService, index: string) => {
      return new GenreElasticSearchRepository(elasticSearchService, index);
    },
    inject: [ElasticsearchService, 'ES_INDEX'],
  },
};

export const USE_CASES = {
  SAVE_GENRE_USE_CASE: {
    provide: SaveGenreUseCase,
    useFactory: (
      genreRepo: IGenreRepository,
      categoryRepo: ICategoryRepository,
    ) => {
      return new SaveGenreUseCase(genreRepo, categoryRepo);
    },
    inject: [
      REPOSITORIES.GENRE_REPOSITORY.provide,
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
    ],
  },
  DELETE_GENRE_USE_CASE: {
    provide: DeleteGenreUseCase,
    useFactory: (genreRepo: IGenreRepository) => {
      return new DeleteGenreUseCase(genreRepo);
    },
    inject: [REPOSITORIES.GENRE_REPOSITORY.provide],
  },
};

export const GENRE_PROVIDERS = {
  REPOSITORIES,
  USE_CASES,
};
