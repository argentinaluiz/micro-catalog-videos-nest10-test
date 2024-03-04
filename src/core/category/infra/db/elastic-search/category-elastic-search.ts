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
  category_description: string | null;
  is_active: boolean;
  created_at: Date | string;
  deleted_at: Date | null;
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
      description: document.category_description,
      is_active: document.is_active,
      created_at: !(document.created_at instanceof Date)
        ? new Date(document.created_at)
        : document.created_at,
    });
  }

  static toDocument(entity: Category): Omit<CategoryDocument, 'deleted_at'> {
    return {
      category_name: entity.name,
      category_description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
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
      document: {
        ...CategoryElasticSearchMapper.toDocument(entity),
        deleted_at: null,
      },
      refresh: true,
    });
  }

  async bulkInsert(entities: Category[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.category_id.id } },
        { ...CategoryElasticSearchMapper.toDocument(entity), deleted_at: null },
      ]),
      refresh: true,
    });
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const document = await this.getDocumentById(id);

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
    const document = await this.getDocumentById(entity.category_id);

    if (!document) {
      throw new NotFoundError(entity.category_id.id, this.getEntity());
    }

    await this.esClient.update({
      index: this.index,
      id: entity.category_id.id,
      body: {
        doc: {
          ...CategoryElasticSearchMapper.toDocument(entity),
          deleted_at: null,
        },
      },
      refresh: true,
    });
  }

  async delete(id: CategoryId): Promise<void> {
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

  private async getDocumentById(
    id: CategoryId,
  ): Promise<CategoryDocument | null> {
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

    return docs[0]._source!;
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
