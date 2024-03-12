import { GenreId } from '../genre.aggregate';
import { NestedGenre } from '../nested-genre.entity';

describe('NestedGenre Without Validator Unit Tests', () => {
  test('constructor of nested category', () => {
    const genre_id = new GenreId();
    const name = 'Movie';
    const is_active = true;
    const deleted_at = new Date();
    const nestedGenre = new NestedGenre({
      genre_id,
      name,
      is_active,
      deleted_at,
    });
    expect(nestedGenre.genre_id).toBe(genre_id);
    expect(nestedGenre.name).toBe(name);
    expect(nestedGenre.is_active).toBe(is_active);
    expect(nestedGenre.deleted_at).toBe(deleted_at);
  });
  describe('create command', () => {
    test('should create a nested genre', () => {
      const genre_id = new GenreId();
      const name = 'Movie';
      const is_active = true;
      const nestedGenre = NestedGenre.create({
        genre_id,
        name,
        is_active,
      });
      expect(nestedGenre.genre_id).toBe(genre_id);
      expect(nestedGenre.name).toBe(name);
      expect(nestedGenre.is_active).toBe(is_active);
      expect(nestedGenre.deleted_at).toBe(null);
    });
  });

  test('should change name', () => {
    const nestedGenre = new NestedGenre({
      genre_id: new GenreId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedGenre.changeName('other name');
    expect(nestedGenre.name).toBe('other name');
  });

  test('should activate', () => {
    const nestedGenre = new NestedGenre({
      genre_id: new GenreId(),
      name: 'Movie',
      is_active: false,
      deleted_at: new Date(),
    });
    nestedGenre.activate();
    expect(nestedGenre.is_active).toBe(true);
  });

  test('should deactivate', () => {
    const nestedGenre = new NestedGenre({
      genre_id: new GenreId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedGenre.deactivate();
    expect(nestedGenre.is_active).toBe(false);
  });

  test('should mark as deleted', () => {
    const nestedGenre = new NestedGenre({
      genre_id: new GenreId(),
      name: 'Movie',
      is_active: true,
      deleted_at: null,
    });
    nestedGenre.markAsDeleted();
    expect(nestedGenre.deleted_at).not.toBeNull();
  });

  test('should mark as not deleted', () => {
    const nestedGenre = new NestedGenre({
      genre_id: new GenreId(),
      name: 'Movie',
      is_active: true,
      deleted_at: new Date(),
    });
    nestedGenre.markAsNotDeleted();
    expect(nestedGenre.deleted_at).toBe(null);
  });
});

describe('NestedGenre Validator', () => {
  describe('create command', () => {
    test('should an invalid category with name property', () => {
      const nestedGenre = NestedGenre.create({
        genre_id: new GenreId(),
        name: 't'.repeat(256),
        is_active: true,
      });

      expect(nestedGenre.notification.hasErrors()).toBe(true);
      expect(nestedGenre.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });

  describe('changeName method', () => {
    it('should a invalid category using name property', () => {
      const nestedGenre = NestedGenre.create({
        genre_id: new GenreId(),
        name: 'Movie',
        is_active: true,
      });
      nestedGenre.changeName('t'.repeat(256));
      expect(nestedGenre.notification.hasErrors()).toBe(true);
      expect(nestedGenre.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
