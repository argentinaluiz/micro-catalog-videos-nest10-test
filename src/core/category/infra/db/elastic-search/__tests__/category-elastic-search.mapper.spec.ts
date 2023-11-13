import { Category, CategoryId } from '../../../../domain/category.aggregate';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryDocument,
  CategoryElasticSearchMapper,
} from '../category-elastic-search';

describe('CategoryElasticSearchMapper', () => {
  let categoryDocument: CategoryDocument;
  let category: Category;

  beforeEach(() => {
    categoryDocument = {
      category_name: 'Test',
      category_description: 'Test description',
      is_active: true,
      created_at: new Date(),
      deleted_at: null,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
    const id = new CategoryId();

    category = new Category({
      category_id: id,
      name: categoryDocument.category_name,
      description: categoryDocument.category_description,
      is_active: categoryDocument.is_active,
      created_at: categoryDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = CategoryElasticSearchMapper.toEntity(
        category.category_id.id,
        categoryDocument,
      );
      expect(result).toEqual(category);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deleted_at, ...otherFields } = categoryDocument;
      const result = CategoryElasticSearchMapper.toDocument(category);
      expect(result).toEqual(otherFields);
    });
  });
});
