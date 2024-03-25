import { Category } from '../../../category/domain/category.aggregate';
import { Genre, GenreId } from '../genre.aggregate';

describe('Genre Without Validator Unit Tests', () => {
  beforeEach(() => {
    Genre.prototype.validate = jest
      .fn()
      .mockImplementation(Genre.prototype.validate);
  });
  test('constructor of genre', () => {
    const genre_id = new GenreId();
    const name = 'Movie';
    const nestedCategory = Category.fake().aNestedCategory().build();
    const is_active = true;
    const created_at = new Date();
    const genre = new Genre({
      genre_id,
      name,
      categories: new Map([[nestedCategory.category_id.id, nestedCategory]]),
      is_active,
      created_at,
    });
    expect(genre.genre_id).toBe(genre_id);
    expect(genre.name).toBe(name);
    expect(genre.categories).toEqual(
      new Map([[nestedCategory.category_id.id, nestedCategory]]),
    );
    expect(genre.is_active).toBe(is_active);
    expect(genre.created_at).toBe(created_at);
  });

  describe('create command', () => {
    test('should create a genre', () => {
      const genre_id = new GenreId();
      const name = 'Movie';
      const nestedCategory = Category.fake().aNestedCategory().build();
      const categoriesId = new Map([
        [nestedCategory.category_id.id, nestedCategory],
      ]);
      const is_active = true;
      const created_at = new Date();
      const genre = Genre.create({
        genre_id,
        name,
        categories_props: [nestedCategory],
        is_active,
        created_at,
      });
      expect(genre.genre_id).toBe(genre_id);
      expect(genre.name).toBe(name);
      expect(genre.categories).toEqual(categoriesId);
      expect(genre.is_active).toBe(is_active);
      expect(genre.created_at).toBe(created_at);
      expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);
    });
  });

  test('should change name', () => {
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'Movie',
      categories_props: [Category.fake().aNestedCategory().build()],
      is_active: true,
      created_at: new Date(),
    });

    const newName = 'Comedy';
    genre.changeName(newName);
    expect(genre.name).toBe(newName);
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(2);
  });

  test('should add category id', () => {
    const nestedCategory = Category.fake().aNestedCategory().build();
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'test',
      categories_props: [nestedCategory],
      is_active: true,
      created_at: new Date(),
    });
    genre.addNestedCategory(nestedCategory);
    expect(genre.categories.size).toBe(1);
    expect(genre.categories).toEqual(
      new Map([[nestedCategory.category_id.id, nestedCategory]]),
    );
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);

    const nestedCategory2 = Category.fake().aNestedCategory().build();
    genre.addNestedCategory(nestedCategory2);
    expect(genre.categories.size).toBe(2);
    expect(genre.categories).toEqual(
      new Map([
        [nestedCategory.category_id.id, nestedCategory],
        [nestedCategory2.category_id.id, nestedCategory2],
      ]),
    );
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);
  });
});

describe('Genre Validator', () => {
  describe('create command', () => {
    test('should an invalid genre with name property', () => {
      const genre = Genre.create({
        name: 't'.repeat(256),
        categories_props: [Category.fake().aNestedCategory().build()],
      } as any);
      expect(genre.notification.hasErrors()).toBe(true);
      expect(genre.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
  describe('changeName method', () => {
    it('should a invalid genre using name property', () => {
      const genre = Genre.fake().aGenre().build();
      genre.changeName('t'.repeat(256));
      expect(genre.notification.hasErrors()).toBe(true);
      expect(genre.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
