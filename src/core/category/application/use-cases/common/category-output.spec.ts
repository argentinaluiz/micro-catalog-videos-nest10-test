import { Category, CategoryId } from '../../../domain/category.aggregate';
import { CategoryOutputMapper } from './category-output';

describe('CategoryOutputMapper Unit Tests', () => {
  it('should convert a category in output', () => {
    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: true,
      created_at: new Date(),
    });
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = CategoryOutputMapper.toOutput(entity);
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.category_id.id,
      name: 'Movie',
      description: 'some description',
      is_active: true,
      created_at: entity.created_at,
    });
  });
});
