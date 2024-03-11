import { CastMemberInMemoryRepository } from '../../core/cast-member/infra/db/in-memory/cast-member-in-memory.repository';
import { DeleteCastMemberUseCase } from '../../core/cast-member/application/use-cases/delete-cast-member/delete-cast-member.use-case';
import { ICastMemberRepository } from '../../core/cast-member/domain/cast-member.repository';
import { CastMemberElasticSearchRepository } from '../../core/cast-member/infra/db/elastic-search/cast-member-elastic-search';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SaveCastMemberUseCase } from '../../core/cast-member/application/use-cases/save-cast-member/save-cast-member.use-case';

export const REPOSITORIES = {
  CAST_MEMBER_REPOSITORY: {
    provide: 'CastMemberRepository',
    useExisting: CastMemberElasticSearchRepository,
  },
  CAST_MEMBER_IN_MEMORY_REPOSITORY: {
    provide: CastMemberInMemoryRepository,
    useClass: CastMemberInMemoryRepository,
  },
  CAST_MEMBER_ELASTIC_SEARCH_REPOSITORY: {
    provide: CastMemberElasticSearchRepository,
    useFactory: (elasticSearchService: ElasticsearchService, index: string) => {
      return new CastMemberElasticSearchRepository(elasticSearchService, index);
    },
    inject: [ElasticsearchService, 'ES_INDEX'],
  },
};

export const USE_CASES = {
  SAVE_CAST_MEMBER_USE_CASE: {
    provide: SaveCastMemberUseCase,
    useFactory: (categoryRepo: ICastMemberRepository) => {
      return new SaveCastMemberUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CAST_MEMBER_REPOSITORY.provide],
  },
  DELETE_CAST_MEMBER_USE_CASE: {
    provide: DeleteCastMemberUseCase,
    useFactory: (categoryRepo: ICastMemberRepository) => {
      return new DeleteCastMemberUseCase(categoryRepo);
    },
    inject: [REPOSITORIES.CAST_MEMBER_REPOSITORY.provide],
  },
};

export const CAST_MEMBER_PROVIDERS = {
  REPOSITORIES,
  USE_CASES,
};
