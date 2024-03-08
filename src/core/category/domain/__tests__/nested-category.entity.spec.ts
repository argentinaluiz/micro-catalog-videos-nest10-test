import { CategoryId } from '../category.aggregate';
import { NestedCategory } from '../nested-category.entity';

describe('NestedCategory Without Validator Unit Tests', () => {
  test('constructor of nested category', () => {
    const category_id = new CategoryId();
    const name = 'Movie';
    const is_active = true;
    const deleted_at = new Date();
    const nestedCategory = new NestedCategory({
      category_id,
      name,
      is_active,
      deleted_at,
    });
    expect(nestedCategory.category_id).toBe(category_id);
    expect(nestedCategory.name).toBe(name);
    expect(nestedCategory.is_active).toBe(is_active);
    expect(nestedCategory.deleted_at).toBe(deleted_at);
  });
  describe('create command', () => {
    test('should create a nested category', () => {
      const category_id = new CategoryId();
      const name = 'Movie';
      const is_active = true;
      const nestedCategory = NestedCategory.create({
        category_id,
        name,
        is_active,
      });
      expect(nestedCategory.category_id).toBe(category_id);
      expect(nestedCategory.name).toBe(name);
      expect(nestedCategory.is_active).toBe(is_active);
      expect(nestedCategory.deleted_at).toBe(null);
    });
  });

  test('should change name', () => {
    const nestedCategory = new NestedCategory({
      category_id: new CategoryId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedCategory.changeName('other name');
    expect(nestedCategory.name).toBe('other name');
  });

  test('should activate', () => {
    const nestedCategory = new NestedCategory({
      category_id: new CategoryId(),
      name: 'Movie',
      is_active: false,
      deleted_at: new Date(),
    });
    nestedCategory.activate();
    expect(nestedCategory.is_active).toBe(true);
  });

  test('should deactivate', () => {
    const nestedCategory = new NestedCategory({
      category_id: new CategoryId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedCategory.deactivate();
    expect(nestedCategory.is_active).toBe(false);
  });

  test('should mark as deleted', () => {
    const nestedCategory = new NestedCategory({
      category_id: new CategoryId(),
      name: 'Movie',
      is_active: true,
      deleted_at: null,
    });
    nestedCategory.markAsDeleted();
    expect(nestedCategory.deleted_at).not.toBeNull();
  });

  test('should mark as not deleted', () => {
    const nestedCategory = new NestedCategory({
      category_id: new CategoryId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedCategory.markAsNotDeleted();
    expect(nestedCategory.deleted_at).toBe(null);
  });
});

describe('NestedCategory Validator', () => {
  describe('create command', () => {
    test('should an invalid category with name property', () => {
      const category = NestedCategory.create({
        category_id: new CategoryId(),
        name: 't'.repeat(256),
        is_active: true,
      });

      expect(category.notification.hasErrors()).toBe(true);
      expect(category.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });

  describe('changeName method', () => {
    it('should a invalid category using name property', () => {
      const category = NestedCategory.create({
        category_id: new CategoryId(),
        name: 'Movie',
        is_active: true,
      });
      category.changeName('t'.repeat(256));
      expect(category.notification.hasErrors()).toBe(true);
      expect(category.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
