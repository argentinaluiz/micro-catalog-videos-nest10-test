import { ElasticsearchService } from '@nestjs/elasticsearch';
import { errors } from '@elastic/transport';
import {
  CategorySearchParams,
  CategorySearchResult,
  ICategoryRepository,
} from '../../../domain/category.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import {
  GetGetResult,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export type CategoryDocument = {
  category_name: string;
  category_description: string | null;
  is_active: boolean;
  created_at: Date | string;
  type: 'Category';
};

export class CategoryElasticSearchMapper {
  static toEntity(id: string, document: CategoryDocument): Category {
    if (document.type !== 'Category') {
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

  static toDocument(entity: Category): CategoryDocument {
    return {
      category_name: entity.name,
      category_description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
      type: 'Category',
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

  async findAll(): Promise<Category[]> {
    const result = await this.esClient.search<CategoryDocument>({
      index: this.index,
      query: {
        match: {
          type: 'Category',
        },
      },
    });
    return result.hits.hits.map((hit) =>
      CategoryElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async findByIds(ids: CategoryId[]): Promise<Category[]> {
    const result = await this.esClient.mget<CategoryDocument>({
      index: this.index,
      body: {
        ids: ids.map((id) => id.id),
      },
      _source: true,
    });
    const docs = result.docs as GetGetResult<CategoryDocument>[];
    return docs
      .filter((doc) => doc.found)
      .map((doc) =>
        CategoryElasticSearchMapper.toEntity(doc._id, doc._source!),
      );
  }

  async existsById(
    ids: CategoryId[],
  ): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.mget<CategoryDocument>({
      index: this.index,
      body: {
        ids: ids.map((id) => id.id),
      },
      _source: ['type'],
    });

    const docs = result.docs as GetGetResult<CategoryDocument>[];
    const existsGenreIds = docs
      .filter((doc) => doc.found && doc._source?.type === 'Category')
      .map((m) => new CategoryId(m._id));
    const notExistsGenreIds = ids.filter(
      (id) => !existsGenreIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsGenreIds,
      not_exists: notExistsGenreIds,
    };
  }

  async update(entity: Category): Promise<void> {
    const document = await this.findById(entity.category_id);

    if (!document) {
      throw new NotFoundError(entity.category_id.id, this.getEntity());
    }

    await this.esClient.update({
      index: this.index,
      id: entity.category_id.id,
      body: {
        doc: CategoryElasticSearchMapper.toDocument(entity),
      },
      refresh: true,
    });
  }

  async delete(id: CategoryId): Promise<void> {
    const document = await this.findById(id);

    if (!document) {
      throw new NotFoundError(id.id, this.getEntity());
    }

    const result = await this.esClient.delete({
      index: this.index,
      id: id.id,
      refresh: true,
    });
    if (!result) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  async findById(id: CategoryId): Promise<Category | null> {
    try {
      const result = await this.esClient.get<CategoryDocument>({
        index: this.index,
        id: id.id,
      });
      return CategoryElasticSearchMapper.toEntity(result._id, result._source!);
    } catch (e) {
      if (e instanceof errors.ResponseError && e.statusCode == 404) {
        return null;
      }

      throw e;
    }
  }

  async search(props: CategorySearchParams): Promise<CategorySearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;
    const result = await this.esClient.search({
      index: this.index,
      from: offset,
      size: limit,
      sort:
        props.sort && this.sortableFieldsMap.hasOwnProperty(props.sort)
          ? { [this.sortableFieldsMap[props.sort]]: props.sort_dir! }
          : undefined,
      ...(props.filter && {
        query: {
          wildcard: {
            category_name: {
              value: `*${props.filter}*`,
              case_insensitive: true,
            },
          },
        },
      }),
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
