import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  CategorySearchParams,
  CategorySearchResult,
  ICategoryRepository,
} from '../../../domain/category.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import {
  GetGetResult,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export const CATEGORY_DOCUMENT_TYPE_NAME = 'Category';

export type CategoryDocument = {
  category_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date | string;
  deleted_at: Date | string | null;
  type: typeof CATEGORY_DOCUMENT_TYPE_NAME;
};

export class CategoryElasticSearchMapper {
  static toEntity(id: string, document: CategoryDocument): Category {
    if (document.type !== CATEGORY_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    return new Category({
      category_id: new CategoryId(id),
      name: document.category_name,
      description: document.description,
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

  static toDocument(entity: Category): CategoryDocument {
    return {
      category_name: entity.name,
      description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
  }
}

export class CategoryElasticSearchRepository implements ICategoryRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    name: 'category_name',
    created_at: 'created_at',
  };

  async insert(entity: Category): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.category_id.id,
      document: CategoryElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Category[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.category_id.id } },
        CategoryElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: CategoryId): Promise<Category | null> {
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
                type: CATEGORY_DOCUMENT_TYPE_NAME,
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

    const docs = result.hits.hits as GetGetResult<CategoryDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source!;

    if (!document) {
      return null;
    }

    return CategoryElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<Category[]> {
    const result = await this.esClient.search<CategoryDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              match: {
                type: CATEGORY_DOCUMENT_TYPE_NAME,
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
      CategoryElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async findByIds(ids: CategoryId[]): Promise<Category[]> {
    const result = await this.esClient.search<CategoryDocument>({
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
                type: CATEGORY_DOCUMENT_TYPE_NAME,
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

    const docs = result.hits.hits as GetGetResult<CategoryDocument>[];
    return docs.map((doc) =>
      CategoryElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
  }

  async existsById(
    ids: CategoryId[],
  ): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.search<CategoryDocument>({
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
                type: CATEGORY_DOCUMENT_TYPE_NAME,
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

    const docs = result.hits.hits as GetGetResult<CategoryDocument>[];
    const existsGenreIds = docs.map((m) => new CategoryId(m._id));
    const notExistsGenreIds = ids.filter(
      (id) => !existsGenreIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsGenreIds,
      not_exists: notExistsGenreIds,
    };
  }

  async update(entity: Category): Promise<void> {
    const response = await this.esClient.updateByQuery({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: entity.category_id.id,
              },
            },
            {
              match: {
                type: CATEGORY_DOCUMENT_TYPE_NAME,
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
      script: {
        source: `
          ctx._source.category_name = params.category_name;
          ctx._source.description = params.description;
          ctx._source.is_active = params.is_active;
          ctx._source.deleted_at = params.deleted_at;
        `,
        params: {
          category_name: entity.name,
          description: entity.description,
          is_active: entity.is_active,
          deleted_at: entity.deleted_at,
        },
      },
      refresh: true,
    });

    if (response.total !== 1) {
      throw new NotFoundError(entity.category_id.id, this.getEntity());
    }
  }

  async delete(id: CategoryId): Promise<void> {
    const response = await this.esClient.deleteByQuery({
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
                type: CATEGORY_DOCUMENT_TYPE_NAME,
              },
            },
          ],
        },
      },
      refresh: true,
    });
    if (response.total !== 1) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  async search(props: CategorySearchParams): Promise<CategorySearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
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
      //@ts-expect-error - must is an array
      query.bool.must.push({
        wildcard: {
          category_name: {
            value: `*${props.filter}*`,
            case_insensitive: true,
          },
        },
      });
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
    const docs = result.hits.hits as GetGetResult<CategoryDocument>[];
    const entities = docs.map((doc) =>
      CategoryElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
    const total = result.hits.total as SearchTotalHits;
    return new CategorySearchResult({
      total: total.value,
      current_page: props.page,
      per_page: props.per_page,
      items: entities,
    });
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
}
