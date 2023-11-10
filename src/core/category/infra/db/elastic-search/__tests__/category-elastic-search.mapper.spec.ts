import { Category, CategoryId } from "../../../../domain/category.aggregate";
import { CategoryDocument, CategoryElasticSearchMapper } from "../category-elastic-search";

describe('CategoryElasticSearchMapper', () => {
  let categoryDocument: CategoryDocument;
  let category: Category;

  beforeEach(() => {
    categoryDocument = {
      id: '1',
      category_name: 'Test',
      category_description: 'Test description',
      is_active: true,
      created_at: new Date(),
    };

    category = new Category({
      category_id: new CategoryId(categoryDocument.id),
      name: categoryDocument.category_name,
      description: categoryDocument.category_description,
      is_active: categoryDocument.is_active,
      created_at: categoryDocument.created_at,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = CategoryElasticSearchMapper.toEntity(categoryDocument);
      expect(result).toEqual(category);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = CategoryElasticSearchMapper.toDocument(category);
      expect(result).toEqual(categoryDocument);
    });
  });
});