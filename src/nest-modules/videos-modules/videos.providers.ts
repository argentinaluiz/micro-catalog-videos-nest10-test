import { VideoInMemoryRepository } from '../../core/video/infra/db/in-memory/video-in-memory.repository';
import { DeleteVideoUseCase } from '../../core/video/application/use-cases/delete-video/delete-video.use-case';
import { IVideoRepository } from '../../core/video/domain/video.repository';
import { VideoElasticSearchRepository } from '../../core/video/infra/db/elastic-search/video-elastic-search';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SaveVideoUseCase } from '../../core/video/application/use-cases/save-video/save-video.use-case';
import { ICategoryRepository } from '../../core/category/domain/category.repository';
import { CATEGORY_PROVIDERS } from '../categories-module/categories.providers';
import { GENRE_PROVIDERS } from '../genres-module/genres.providers';
import { IGenreRepository } from '../../core/genre/domain/genre.repository';
import { ICastMemberRepository } from '../../core/cast-member/domain/cast-member.repository';
import { CAST_MEMBER_PROVIDERS } from '../cast-members-module/cast-members.providers';

export const REPOSITORIES = {
  VIDEO_REPOSITORY: {
    provide: 'VideoRepository',
    useExisting: VideoElasticSearchRepository,
  },
  VIDEO_IN_MEMORY_REPOSITORY: {
    provide: VideoInMemoryRepository,
    useClass: VideoInMemoryRepository,
  },
  VIDEO_ELASTIC_SEARCH_REPOSITORY: {
    provide: VideoElasticSearchRepository,
    useFactory: (elasticSearchService: ElasticsearchService, index: string) => {
      return new VideoElasticSearchRepository(elasticSearchService, index);
    },
    inject: [ElasticsearchService, 'ES_INDEX'],
  },
};

export const USE_CASES = {
  SAVE_VIDEO_USE_CASE: {
    provide: SaveVideoUseCase,
    useFactory: (
      videoRepo: IVideoRepository,
      categoryRepo: ICategoryRepository,
      genreRepo: IGenreRepository,
      castMemberRepo: ICastMemberRepository,
    ) => {
      return new SaveVideoUseCase(
        videoRepo,
        categoryRepo,
        genreRepo,
        castMemberRepo,
      );
    },
    inject: [
      REPOSITORIES.VIDEO_REPOSITORY.provide,
      CATEGORY_PROVIDERS.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      GENRE_PROVIDERS.REPOSITORIES.GENRE_REPOSITORY.provide,
      CAST_MEMBER_PROVIDERS.REPOSITORIES.CAST_MEMBER_REPOSITORY.provide,
    ],
  },
  DELETE_VIDEO_USE_CASE: {
    provide: DeleteVideoUseCase,
    useFactory: (videoRepo: IVideoRepository) => {
      return new DeleteVideoUseCase(videoRepo);
    },
    inject: [REPOSITORIES.VIDEO_REPOSITORY.provide],
  },
};

export const VIDEO_PROVIDERS = {
  REPOSITORIES,
  USE_CASES,
};
