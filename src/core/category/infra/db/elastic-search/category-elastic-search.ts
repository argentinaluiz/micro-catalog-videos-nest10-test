import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  CategorySearchParams,
  CategorySearchResult,
  ICategoryRepository,
} from '../../../domain/category.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';

export type CategoryDocument = {
  id: string;
  category_name: string;
  category_description: string;
  is_active: boolean;
  created_at: Date;
};

export class CategoryElasticSearchMapper {
  static toEntity(document: CategoryDocument): Category {
    return new Category({
      category_id: new CategoryId(document.id),
      name: document.category_name,
      description: document.category_description,
      is_active: document.is_active,
      created_at: document.created_at,
    });
  }

  static toDocument(entity: Category): CategoryDocument {
    return {
      id: entity.category_id.id,
      category_name: entity.name,
      category_description: entity.description,
      is_active: entity.is_active,
      created_at: entity.created_at,
    };
  }
}

export class CategoryElasticSearchRepository implements ICategoryRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  sortableFields: string[];
  search(props: CategorySearchParams): Promise<CategorySearchResult> {
    throw new Error('Method not implemented.');
  }
  async insert(entity: Category): Promise<void> {
    this.esClient.index({
      index: this.index,
      document: CategoryElasticSearchMapper.toDocument(entity),
    });
  }
  bulkInsert(entities: Category[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findById(id: CategoryId): Promise<Category> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }
  findByIds(ids: CategoryId[]): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }
  existsById(
    ids: CategoryId[],
  ): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    throw new Error('Method not implemented.');
  }
  update(entity: Category): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(id: CategoryId): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getEntity(): new (...args: any[]) => Category {
    throw new Error('Method not implemented.');
  }
}
