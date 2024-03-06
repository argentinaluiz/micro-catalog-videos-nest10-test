import { CategoryId } from '../../../category/domain/category.aggregate';
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
    const categoryId = new CategoryId();
    const is_active = true;
    const created_at = new Date();
    const genre = new Genre({
      genre_id,
      name,
      categories_id: new Map([[categoryId.id, categoryId]]),
      is_active,
      created_at,
    });
    expect(genre.genre_id).toBe(genre_id);
    expect(genre.name).toBe(name);
    expect(genre.categories_id).toEqual(new Map([[categoryId.id, categoryId]]));
    expect(genre.is_active).toBe(is_active);
    expect(genre.created_at).toBe(created_at);
  });

  describe('create command', () => {
    test('should create a genre', () => {
      const genre_id = new GenreId();
      const name = 'Movie';
      const categoryId = new CategoryId();
      const categoriesId = new Map([[categoryId.id, categoryId]]);
      const is_active = true;
      const created_at = new Date();
      const genre = Genre.create({
        genre_id,
        name,
        categories_id: [categoryId],
        is_active,
        created_at,
      });
      expect(genre.genre_id).toBe(genre_id);
      expect(genre.name).toBe(name);
      expect(genre.categories_id).toEqual(categoriesId);
      expect(genre.is_active).toBe(is_active);
      expect(genre.created_at).toBe(created_at);
      expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);
    });
  });

  test('should change name', () => {
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'Movie',
      categories_id: [new CategoryId()],
      is_active: true,
      created_at: new Date(),
    });

    const newName = 'Comedy';
    genre.changeName(newName);
    expect(genre.name).toBe(newName);
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(2);
  });

  test('should add category id', () => {
    const categoryId = new CategoryId();
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'test',
      categories_id: [categoryId],
      is_active: true,
      created_at: new Date(),
    });
    genre.addCategoryId(categoryId);
    expect(genre.categories_id.size).toBe(1);
    expect(genre.categories_id).toEqual(new Map([[categoryId.id, categoryId]]));
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);

    const categoryId2 = new CategoryId();
    genre.addCategoryId(categoryId2);
    expect(genre.categories_id.size).toBe(2);
    expect(genre.categories_id).toEqual(
      new Map([
        [categoryId.id, categoryId],
        [categoryId2.id, categoryId2],
      ]),
    );
    expect(Genre.prototype.validate).toHaveBeenCalledTimes(1);
  });
});

describe('Genre Validator', () => {
  describe('create command', () => {
    test('should an invalid genre with name property', () => {
      const categoryId = new CategoryId();
      const genre = Genre.create({
        name: 't'.repeat(256),
        categories_id: [categoryId],
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
