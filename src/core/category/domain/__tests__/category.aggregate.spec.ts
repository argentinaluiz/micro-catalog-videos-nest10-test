import { Category, CategoryId } from '../category.aggregate';

describe('Category Without Validator Unit Tests', () => {
  beforeEach(() => {
    Category.prototype.validate = jest
      .fn()
      .mockImplementation(Category.prototype.validate);
  });
  test('constructor of category', () => {
    const category_id = new CategoryId();
    const name = 'Movie';
    const description = null;
    const is_active = true;
    const created_at = new Date();
    const category = new Category({
      category_id,
      name,
      description,
      is_active,
      created_at,
    });
    expect(category.category_id).toBe(category_id);
    expect(category.name).toBe(name);
    expect(category.description).toBe(description);
    expect(category.is_active).toBe(is_active);
    expect(category.created_at).toBe(created_at);
  });

  describe('create command', () => {
    test('should create a category', () => {
      const category_id = new CategoryId();
      const name = 'Movie';
      const description = null;
      const is_active = true;
      const created_at = new Date();
      const category = Category.create({
        category_id,
        name,
        description,
        is_active,
        created_at,
      });
      expect(category.category_id).toBe(category_id);
      expect(category.name).toBe(name);
      expect(category.description).toBe(description);
      expect(category.is_active).toBe(is_active);
      expect(category.created_at).toBe(created_at);
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBe(false);
    });
  });

  test('should change name', () => {
    const category = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    category.changeName('other name');
    expect(category.name).toBe('other name');
    expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
    expect(category.notification.hasErrors()).toBe(false);
  });

  test('should change description', () => {
    const category = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    category.changeDescription('some description');
    expect(category.description).toBe('some description');
    expect(category.notification.hasErrors()).toBe(false);
  });

  test('should active a category', () => {
    const category = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: null,
      is_active: false,
      created_at: new Date(),
    });
    category.activate();
    expect(category.is_active).toBe(true);
    expect(category.notification.hasErrors()).toBe(false);
  });

  test('should disable a category', () => {
    const category = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    category.deactivate();
    expect(category.is_active).toBe(false);
    expect(category.notification.hasErrors()).toBe(false);
  });
});

describe('Category Validator', () => {
  describe('create command', () => {
    test('should an invalid category with name property', () => {
      const category = Category.create({
        category_id: new CategoryId(),
        name: 't'.repeat(256),
        description: null,
        is_active: true,
        created_at: new Date(),
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
      const category = Category.create({
        category_id: new CategoryId(),
        name: 'Movie',
        description: null,
        is_active: true,
        created_at: new Date(),
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
