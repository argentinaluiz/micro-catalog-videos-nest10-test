import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  GenreSearchParams,
  GenreSearchResult,
  IGenreRepository,
} from '../../../domain/genre.repository';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import {
  GetGetResult,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { CategoryId } from '../../../../category/domain/category.aggregate';

export const GENRE_DOCUMENT_TYPE_NAME = 'Genre';

export type GenreDocument = {
  genre_name: string;
  categories: string[];
  is_active: boolean;
  created_at: Date | string;
  deleted_at: Date | null;
  type: typeof GENRE_DOCUMENT_TYPE_NAME;
};

export class GenreElasticSearchMapper {
  static toEntity(id: string, document: GenreDocument): Genre {
    if (document.type !== GENRE_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    return new Genre({
      genre_id: new GenreId(id),
      name: document.genre_name,
      categories_id: new Map(
        document.categories.map((category_id) => [
          category_id,
          new CategoryId(category_id),
        ]),
      ),
      is_active: document.is_active,
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
  }

  static toDocument(entity: Genre): GenreDocument {
    return {
      genre_name: entity.name,
      categories: Array.from(entity.categories_id.keys()),
      is_active: entity.is_active,
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: GENRE_DOCUMENT_TYPE_NAME,
    };
  }
}

export class GenreElasticSearchRepository implements IGenreRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    name: 'genre_name',
    created_at: 'created_at',
  };

  async insert(entity: Genre): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.genre_id.id,
      document: GenreElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Genre[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.genre_id.id } },
        GenreElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: GenreId): Promise<Genre | null> {
    const document = await this.getDocumentById(id);

    if (!document) {
      return null;
    }

    return GenreElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<Genre[]> {
    const result = await this.esClient.search<GenreDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              match: {
                type: GENRE_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });
    return result.hits.hits.map((hit) =>
      GenreElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async findByIds(ids: GenreId[]): Promise<Genre[]> {
    const result = await this.esClient.search<GenreDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: ids.map((id) => id.id),
              },
            },
            {
              match: {
                type: GENRE_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });

    const docs = result.hits.hits as GetGetResult<GenreDocument>[];
    return docs.map((doc) =>
      GenreElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
  }

  async existsById(
    ids: GenreId[],
  ): Promise<{ exists: GenreId[]; not_exists: GenreId[] }> {
    const result = await this.esClient.search<GenreDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: ids.map((id) => id.id),
              },
            },
            {
              match: {
                type: GENRE_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
      _source: false,
    });

    const docs = result.hits.hits as GetGetResult<GenreDocument>[];
    const existsGenreIds = docs.map((m) => new GenreId(m._id));
    const notExistsGenreIds = ids.filter(
      (id) => !existsGenreIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsGenreIds,
      not_exists: notExistsGenreIds,
    };
  }

  async update(entity: Genre): Promise<void> {
    const document = await this.getDocumentById(entity.genre_id);

    if (!document) {
      throw new NotFoundError(entity.genre_id.id, this.getEntity());
    }

    await this.esClient.update({
      index: this.index,
      id: entity.genre_id.id,
      body: {
        doc: GenreElasticSearchMapper.toDocument(entity),
      },
      refresh: true,
    });
  }

  async delete(id: GenreId): Promise<void> {
    const document = await this.getDocumentById(id);

    if (!document) {
      throw new NotFoundError(id.id, this.getEntity());
    }

    await this.esClient.update({
      index: this.index,
      id: id.id,
      body: {
        doc: {
          ...document,
          deleted_at: new Date(),
        },
      },
      refresh: true,
    });
  }

  private async getDocumentById(id: GenreId): Promise<GenreDocument | null> {
    const result = await this.esClient.search({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: id.id,
              },
            },
            {
              match: {
                type: GENRE_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });

    const docs = result.hits.hits as GetGetResult<GenreDocument>[];

    if (docs.length === 0) {
      return null;
    }

    return docs[0]._source!;
  }

  async search(props: GenreSearchParams): Promise<GenreSearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
        must_not: [
          {
            exists: {
              field: 'deleted_at',
            },
          },
        ],
      },
    };

    if (props.filter) {
      if (props.filter.name) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          wildcard: {
            genre_name: {
              value: `*${props.filter}*`,
              case_insensitive: true,
            },
          },
        });
      }

      if (props.filter.categories_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          terms: {
            categories: props.filter.categories_id.map((id) => id.id),
          },
        });
      }
    }

    const result = await this.esClient.search({
      index: this.index,
      from: offset,
      size: limit,
      sort:
        props.sort && this.sortableFieldsMap.hasOwnProperty(props.sort)
          ? { [this.sortableFieldsMap[props.sort]]: props.sort_dir! }
          : { created_at: 'desc' },
      query,
    });
    const docs = result.hits.hits as GetGetResult<GenreDocument>[];
    const entities = docs.map((doc) =>
      GenreElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
    const total = result.hits.total as SearchTotalHits;
    return new GenreSearchResult({
      total: total.value,
      current_page: props.page,
      per_page: props.per_page,
      items: entities,
    });
  }

  getEntity(): new (...args: any[]) => Genre {
    return Genre;
  }
}
