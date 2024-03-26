import { CategoryInMemoryRepository } from '../../core/category/infra/db/in-memory/category-in-memory.repository';
import { ListAllCategoriesUseCase } from '../../core/category/application/use-cases/list-all-categories/list-all-categories.use-case';
import { GetCategoryUseCase } from '../../core/category/application/use-cases/get-category/get-category.use-case';
import { DeleteCategoryUseCase } from '../../core/category/application/use-cases/delete-category/delete-category.use-case';
import { ICategoryRepository } from '../../core/category/domain/category.repository';
import { CategoryElasticSearchRepository } from '../../core/category/infra/db/elastic-search/category-elastic-search';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SaveCategoryUseCase } from '../../core/category/application/use-cases/save-category/save-category.use-case';

export const REPOSITORIES = {
  CATEGORY_REPOSITORY: {
    provide: 'CategoryRepository',
    useExisting: CategoryElasticSearchRepository,
  },
  CATEGORY_IN_MEMORY_REPOSITORY: {
    provide: CategoryInMemoryRepository,
    useClass: CategoryInMemoryRepository,
  },
  CATEGORY_ELASTIC_SEARCH_REPOSITORY: {
    provide: CategoryElasticSearchRepository,
    useFactory: (elasticSearchService: ElasticsearchService, index: string) => {
      return new CategoryElasticSearchRepository(elasticSearchService, index);
    },
    inject: [ElasticsearchService, 'ES_INDEX'],
  },
};

export const USE_CASES = {
  SAVE_CATEGORY_USE_CASE: {
    provide: SaveCategoryUseCase,
    useFactory: (categoryRepo: ICategoryRepository) => {
      return new SaveCategoryUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CATEGORY_REPOSITORY.provide],
  },
  LIST_ALL_CATEGORIES_USE_CASE: {
    provide: ListAllCategoriesUseCase,
    useFactory: (categoryRepo: ICategoryRepository) => {
      return new ListAllCategoriesUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CATEGORY_REPOSITORY.provide],
  },
  GET_CATEGORY_USE_CASE: {
    provide: GetCategoryUseCase,
    useFactory: (categoryRepo: ICategoryRepository) => {
      return new GetCategoryUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CATEGORY_REPOSITORY.provide],
  },
  DELETE_CATEGORY_USE_CASE: {
    provide: DeleteCategoryUseCase,
    useFactory: (categoryRepo: ICategoryRepository) => {
      return new DeleteCategoryUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CATEGORY_REPOSITORY.provide],
  },
};

export const CATEGORY_PROVIDERS = {
  REPOSITORIES,
  USE_CASES,
};
