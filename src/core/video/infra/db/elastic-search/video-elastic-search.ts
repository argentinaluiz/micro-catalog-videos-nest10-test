import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  VideoSearchParams,
  VideoSearchResult,
  IVideoRepository,
} from '../../../domain/video.repository';
import { Video, VideoId } from '../../../domain/video.aggregate';
import {
  GetGetResult,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { CategoryId } from '../../../../category/domain/category.aggregate';
import { NestedCategory } from '../../../../category/domain/nested-category.entity';
import { Notification } from '../../../../shared/domain/validators/notification';
import { LoadEntityError } from '../../../../shared/domain/validators/validation.error';
import { NestedGenre } from '../../../../genre/domain/nested-genre.entity';
import { GenreId } from '../../../../genre/domain/genre.aggregate';
import { NestedCastMember } from '../../../../cast-member/domain/nested-cast-member.entity';
import { CastMemberId } from '../../../../cast-member/domain/cast-member.aggregate';
import {
  CastMemberType,
  InvalidCastMemberTypeError,
} from '../../../../cast-member/domain/cast-member-type.vo';
import { Either } from '../../../../shared/domain/either';
import { Rating } from '../../../domain/rating.vo';
import { SortDirection } from '../../../../shared/domain/repository/search-params';

export const VIDEO_DOCUMENT_TYPE_NAME = 'Video';

export type VideoDocument = {
  video_title: string;
  video_title_keyword: string;
  video_description: string;
  year_launched: number;
  duration: number;
  rating: string;
  is_opened: boolean;
  is_published: boolean;
  banner_url: string | null;
  thumbnail_url: string | null;
  thumbnail_half_url: string | null;
  trailer_url: string;
  video_url: string;
  categories: {
    category_id: string;
    category_name: string;
    is_active: boolean;
    deleted_at: Date | string | null;
  }[];
  genres: {
    genre_id: string;
    genre_name: string;
    is_active: boolean;
    deleted_at: Date | string | null;
  }[];
  cast_members: {
    cast_member_id: string;
    cast_member_name: string;
    cast_member_type: number;
    deleted_at: Date | string | null;
  }[];
  created_at: Date | string;
  deleted_at: Date | string | null;
  type: typeof VIDEO_DOCUMENT_TYPE_NAME;
};

export class VideoElasticSearchMapper {
  static toEntity(id: string, document: VideoDocument): Video {
    if (document.type !== VIDEO_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    const notification = new Notification();

    const [rating, errorRating] = Rating.create(
      document.rating as any,
    ).asArray();

    if (errorRating) {
      notification.addError(errorRating.message, 'rating');
    }

    const nestedCategories = document.categories.map(
      (category) =>
        new NestedCategory({
          category_id: new CategoryId(category.category_id),
          name: category.category_name,
          is_active: category.is_active,
          deleted_at:
            category.deleted_at === null
              ? null
              : !(category.deleted_at instanceof Date)
                ? new Date(category.deleted_at)
                : category.deleted_at,
        }),
    );

    if (!nestedCategories.length) {
      notification.addError('categories should not be empty', 'categories');
    }

    const nestedGenres = document.genres.map(
      (genre) =>
        new NestedGenre({
          genre_id: new GenreId(genre.genre_id),
          name: genre.genre_name,
          is_active: genre.is_active,
          deleted_at:
            genre.deleted_at === null
              ? null
              : !(genre.deleted_at instanceof Date)
                ? new Date(genre.deleted_at)
                : genre.deleted_at,
        }),
    );

    if (!nestedGenres.length) {
      notification.addError('genres should not be empty', 'genres');
    }

    const [cast_members, errorsCastMembers] = Either.ok(document.cast_members)
      .map((cast_members) => cast_members || [])
      .chainEach<NestedCastMember[], InvalidCastMemberTypeError[]>(
        (cast_member) => {
          const [type, errorType] = CastMemberType.create(
            cast_member.cast_member_type,
          ).asArray();

          if (errorType) {
            return Either.fail(errorType);
          }

          return Either.ok(
            new NestedCastMember({
              cast_member_id: new CastMemberId(cast_member.cast_member_id),
              name: cast_member.cast_member_name,
              type,
              deleted_at:
                cast_member.deleted_at === null
                  ? null
                  : !(cast_member.deleted_at instanceof Date)
                    ? new Date(cast_member.deleted_at)
                    : cast_member.deleted_at,
            }),
          );
        },
      )
      .asArray();

    if (!cast_members.length) {
      notification.addError('genres should not be empty', 'genres');
    }

    if (errorsCastMembers && errorsCastMembers.length) {
      errorsCastMembers.forEach((error) => {
        notification.addError(error.message, 'cast_members');
      });
    }

    const video = new Video({
      video_id: new VideoId(id),
      title: document.video_title,
      description: document.video_description,
      year_launched: document.year_launched,
      duration: document.duration,
      rating,
      is_opened: document.is_opened,
      is_published: document.is_published,
      banner_url: document.banner_url,
      thumbnail_url: document.thumbnail_url,
      thumbnail_half_url: document.thumbnail_half_url,
      trailer_url: document.trailer_url,
      video_url: document.video_url,

      categories: new Map(
        nestedCategories.map((category) => [category.category_id.id, category]),
      ),
      genres: new Map(nestedGenres.map((genre) => [genre.genre_id.id, genre])),
      cast_members: new Map(
        cast_members.map((cast_member) => [
          cast_member.cast_member_id.id,
          cast_member,
        ]),
      ),
      created_at: !(document.created_at instanceof Date)
        ? new Date(document.created_at)
        : document.created_at,
      deleted_at:
        document.deleted_at === null
          ? null
          : !(document.deleted_at instanceof Date)
            ? new Date(document.deleted_at!)
            : document.deleted_at,
    });

    video.validate();

    notification.copyErrors(video.notification);

    if (notification.hasErrors()) {
      throw new LoadEntityError(notification.toJSON());
    }

    return video;
  }

  static toDocument(entity: Video): VideoDocument {
    return {
      video_title: entity.title,
      video_title_keyword: entity.title,
      video_description: entity.description,
      year_launched: entity.year_launched,
      duration: entity.duration,
      rating: entity.rating.value,
      is_opened: entity.is_opened,
      is_published: entity.is_published,
      banner_url: entity.banner_url,
      thumbnail_url: entity.thumbnail_url,
      thumbnail_half_url: entity.thumbnail_half_url,
      trailer_url: entity.trailer_url,
      video_url: entity.video_url,
      categories: Array.from(entity.categories.values()).map((category) => ({
        category_id: category.category_id.id,
        category_name: category.name,
        is_active: category.is_active,
        deleted_at: category.deleted_at,
      })),
      genres: Array.from(entity.genres.values()).map((genre) => ({
        genre_id: genre.genre_id.id,
        genre_name: genre.name,
        is_active: genre.is_active,
        deleted_at: genre.deleted_at,
      })),
      cast_members: Array.from(entity.cast_members.values()).map(
        (cast_member) => ({
          cast_member_id: cast_member.cast_member_id.id,
          cast_member_name: cast_member.name,
          cast_member_type: cast_member.type.type,
          deleted_at: cast_member.deleted_at,
        }),
      ),
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: VIDEO_DOCUMENT_TYPE_NAME,
    };
  }
}

export class VideoElasticSearchRepository implements IVideoRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  scopes: string[] = [];
  sortableFields: string[] = ['title', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    title: 'video_title_keyword',
    created_at: 'created_at',
  };

  async insert(entity: Video): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.video_id.id,
      document: VideoElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Video[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.video_id.id } },
        VideoElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: VideoId): Promise<Video | null> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: id.id,
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      query: scopedQuery,
    });

    const docs = result.hits.hits as GetGetResult<VideoDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source!;

    if (!document) {
      return null;
    }

    return VideoElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<Video[]> {
    const query = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search<VideoDocument>({
      index: this.index,
      query: scopedQuery,
    });
    return result.hits.hits.map((hit) =>
      VideoElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async findByIds(
    ids: VideoId[],
  ): Promise<{ exists: Video[]; not_exists: VideoId[] }> {
    const query = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.id),
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search<VideoDocument>({
      index: this.index,
      query: scopedQuery,
    });

    const docs = result.hits.hits as GetGetResult<VideoDocument>[];
    return {
      exists: docs.map((doc) =>
        VideoElasticSearchMapper.toEntity(doc._id, doc._source!),
      ),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.id)),
    };
  }

  async findOneBy(filter: { video_id?: VideoId }): Promise<Video | null> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.video_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.video_id.id,
        },
      });
    }

    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search<VideoDocument>({
      index: this.index,
      query: scopedQuery,
    });

    const docs = result.hits.hits as GetGetResult<VideoDocument>[];

    if (!docs.length) {
      return null;
    }

    return VideoElasticSearchMapper.toEntity(docs[0]._id, docs[0]._source!);
  }

  async findBy(
    filter: {
      video_id?: VideoId;
      is_active?: boolean;
    },
    order?: {
      field: 'name' | 'created_at';
      direction: SortDirection;
    },
  ): Promise<Video[]> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.video_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.video_id.id,
        },
      });
    }

    if (filter.is_active !== undefined) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search<VideoDocument>({
      index: this.index,
      query: scopedQuery,
      sort:
        order && this.sortableFieldsMap.hasOwnProperty(order.field)
          ? { [this.sortableFieldsMap[order.field]]: order.direction }
          : undefined,
    });

    return result.hits.hits.map((hit) =>
      VideoElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async existsById(
    ids: VideoId[],
  ): Promise<{ exists: VideoId[]; not_exists: VideoId[] }> {
    const query = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.id),
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search<VideoDocument>({
      index: this.index,
      query: scopedQuery,
      _source: false,
    });

    const docs = result.hits.hits as GetGetResult<VideoDocument>[];
    const existsVideoIds = docs.map((m) => new VideoId(m._id));
    const notExistsVideoIds = ids.filter(
      (id) => !existsVideoIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsVideoIds,
      not_exists: notExistsVideoIds,
    };
  }

  async update(entity: Video): Promise<void> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: entity.video_id.id,
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const response = await this.esClient.updateByQuery({
      index: this.index,
      query: scopedQuery,
      script: {
        source: `
          ctx._source.video_title = params.video_title;
          ctx._source.video_title_keyword = params.video_title_keyword;
          ctx._source.video_description = params.video_description;
          ctx._source.year_launched = params.year_launched;
          ctx._source.duration = params.duration;
          ctx._source.rating = params.rating;
          ctx._source.is_opened = params.is_opened;
          ctx._source.is_published = params.is_published;
          ctx._source.banner_url = params.banner_url;
          ctx._source.thumbnail_url = params.thumbnail_url;
          ctx._source.thumbnail_half_url = params.thumbnail_half_url;
          ctx._source.trailer_url = params.trailer_url;
          ctx._source.video_url = params.video_url;
          ctx._source.categories = params.categories;
          ctx._source.genres = params.genres;
          ctx._source.cast_members = params.cast_members;
          ctx._source.created_at = params.created_at;
          ctx._source.deleted_at = params.deleted_at;
        `,
        params: {
          ...VideoElasticSearchMapper.toDocument(entity),
        },
      },
      refresh: true,
    });

    if (response.total !== 1) {
      throw new NotFoundError(entity.video_id.id, this.getEntity());
    }
  }

  async delete(id: VideoId): Promise<void> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: id.id,
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    const scopedQuery = this.applyScopes(query);
    const response = await this.esClient.deleteByQuery({
      index: this.index,
      query: scopedQuery,
      refresh: true,
    });
    if (response.deleted !== 1) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  async search(props: VideoSearchParams): Promise<VideoSearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (props.filter) {
      if (props.filter.title_or_description) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          multi_match: {
            query: props.filter.title_or_description,
            type: 'most_fields',
            fields: ['video_title', 'video_description'],
            fuzziness: 'AUTO',
          },
        });
      }

      if (props.filter.categories_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'categories',
            query: {
              terms: {
                'categories.category_id': props.filter.categories_id.map(
                  (c) => c.id,
                ),
              },
            },
          },
        });
      }

      if (props.filter.genres_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'genres',
            query: {
              terms: {
                'genres.genre_id': props.filter.genres_id.map((g) => g.id),
              },
            },
          },
        });
      }

      if (props.filter.cast_members_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'cast_members',
            query: {
              terms: {
                'cast_members.cast_member_id': props.filter.cast_members_id.map(
                  (c) => c.id,
                ),
              },
            },
          },
        });
      }
      if (props.filter.is_published !== undefined) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          match: {
            is_published: props.filter.is_published,
          },
        });
      }
    }

    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      from: offset,
      size: limit,
      sort:
        props.sort && this.sortableFieldsMap.hasOwnProperty(props.sort)
          ? { [this.sortableFieldsMap[props.sort]]: props.sort_dir! }
          : { created_at: 'desc' },
      query: scopedQuery,
    });
    const docs = result.hits.hits as GetGetResult<VideoDocument>[];
    const entities = docs.map((doc) =>
      VideoElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
    const total = result.hits.total as SearchTotalHits;
    return new VideoSearchResult({
      total: total.value,
      current_page: props.page,
      per_page: props.per_page,
      items: entities,
    });
  }

  ignoreSoftDeleted(): VideoElasticSearchRepository {
    this.scopes.push('ignore-soft-deleted');
    return this;
  }
  clearScopes(): VideoElasticSearchRepository {
    this.scopes = [];
    return this;
  }

  protected applyScopes(query: QueryDslQueryContainer) {
    return this.scopes.includes('ignore-soft-deleted')
      ? {
          ...query,
          bool: {
            ...query.bool,
            must_not: [
              {
                exists: {
                  field: 'deleted_at',
                },
              },
            ],
          },
        }
      : query;
  }

  getEntity(): new (...args: any[]) => Video {
    return Video;
  }
}
