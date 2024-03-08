import { Chance } from 'chance';
import { GenreFakeBuilder } from '../genre-fake.builder';
import { GenreId } from '../genre.aggregate';
import { Category } from '../../../category/domain/category.aggregate';
import { NestedCategory } from '../../../category/domain/nested-category.entity';

describe('GenreFakerBuilder Unit Tests', () => {
  describe('genre_id prop', () => {
    const faker = GenreFakeBuilder.aGenre();

    test('should be a function', () => {
      expect(typeof faker['_genre_id']).toBe('function');
    });

    test('withGenreId', () => {
      const genre_id = new GenreId();
      const $this = faker.withGenreId(genre_id);
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_genre_id']).toBe(genre_id);

      faker.withGenreId(() => genre_id);
      //@ts-expect-error _genre_id is a callable
      expect(faker['_genre_id']()).toBe(genre_id);

      expect(faker.genre_id).toBe(genre_id);
    });

    test('should pass index to genre_id factory', () => {
      let mockFactory = jest.fn(() => new GenreId());
      faker.withGenreId(mockFactory);
      faker.build();
      expect(mockFactory).toHaveBeenCalledTimes(1);

      const genreId = new GenreId();
      mockFactory = jest.fn(() => genreId);
      const fakerMany = GenreFakeBuilder.theGenres(2);
      fakerMany.withGenreId(mockFactory);
      fakerMany.build();

      expect(mockFactory).toHaveBeenCalledTimes(2);
      expect(fakerMany.build()[0].genre_id).toBe(genreId);
      expect(fakerMany.build()[1].genre_id).toBe(genreId);
    });
  });

  describe('name prop', () => {
    const faker = GenreFakeBuilder.aGenre();
    test('should be a function', () => {
      expect(typeof faker['_name']).toBe('function');
    });

    test('should call the word method', () => {
      const chance = Chance();
      const spyWordMethod = jest.spyOn(chance, 'word');
      faker['chance'] = chance;
      faker.build();

      expect(spyWordMethod).toHaveBeenCalled();
    });

    test('withName', () => {
      const $this = faker.withName('test name');
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_name']).toBe('test name');

      faker.withName(() => 'test name');
      //@ts-expect-error name is callable
      expect(faker['_name']()).toBe('test name');

      expect(faker.name).toBe('test name');
    });

    test('should pass index to name factory', () => {
      faker.withName((index) => `test name ${index}`);
      const genre = faker.build();
      expect(genre.name).toBe(`test name 0`);

      const fakerMany = GenreFakeBuilder.theGenres(2);
      fakerMany.withName((index) => `test name ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].name).toBe(`test name 0`);
      expect(categories[1].name).toBe(`test name 1`);
    });

    test('invalid too long case', () => {
      const $this = faker.withInvalidNameTooLong();
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_name'].length).toBe(256);

      const tooLong = 'a'.repeat(256);
      faker.withInvalidNameTooLong(tooLong);
      expect(faker['_name'].length).toBe(256);
      expect(faker['_name']).toBe(tooLong);
    });
  });

  describe('categories prop', () => {
    const faker = GenreFakeBuilder.aGenre();
    it('should be empty', () => {
      expect(faker['_categories']).toBeInstanceOf(Array);
    });

    test('addNestedCategory', () => {
      const nestedCategory = Category.fake().aCategoryAndNested().build()[1];
      const $this = faker.addNestedCategory(nestedCategory);
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_categories']).toStrictEqual([nestedCategory]);

      const nestedCategory2 = Category.fake().aCategoryAndNested().build()[1];
      faker.addNestedCategory(() => nestedCategory2);

      expect([
        faker['_categories'][0],
        //@ts-expect-error _categories is callable
        faker['_categories'][1](),
      ]).toStrictEqual([nestedCategory, nestedCategory2]);
    });

    it('should pass index to categories factory', () => {
      const nestedCategories = [
        Category.fake().aCategoryAndNested().build()[1],
        Category.fake().aCategoryAndNested().build()[1],
      ];
      faker.addNestedCategory((index) => nestedCategories[index]);
      const genre = faker.build();

      expect(genre.categories.get(nestedCategories[0].category_id.id)).toBe(
        nestedCategories[0],
      );

      const fakerMany = GenreFakeBuilder.theGenres(2);
      fakerMany.addNestedCategory((index) => nestedCategories[index]);
      const genres = fakerMany.build();

      expect(genres[0].categories.get(nestedCategories[0].category_id.id)).toBe(
        nestedCategories[0],
      );

      expect(genres[1].categories.get(nestedCategories[1].category_id.id)).toBe(
        nestedCategories[1],
      );
    });
  });

  describe('is_active prop', () => {
    const faker = GenreFakeBuilder.aGenre();
    it('should be a function', () => {
      expect(typeof faker['_is_active'] === 'function').toBeTruthy();
    });

    test('activate', () => {
      const $this = faker.activate();
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_is_active']).toBeTruthy();
      expect(faker.is_active).toBeTruthy();
    });

    test('deactivate', () => {
      const $this = faker.deactivate();
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_is_active']).toBeFalsy();
      expect(faker.is_active).toBeFalsy();
    });
  });

  describe('created_at prop', () => {
    const faker = GenreFakeBuilder.aGenre();

    test('should be a function', () => {
      expect(typeof faker['_created_at']).toBe('function');
    });

    test('withCreatedAt', () => {
      const date = new Date();
      const $this = faker.withCreatedAt(date);
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_created_at']).toBe(date);

      faker.withCreatedAt(() => date);
      //@ts-expect-error _created_at is a callable
      expect(faker['_created_at']()).toBe(date);
      expect(faker.created_at).toBe(date);
    });

    test('should pass index to created_at factory', () => {
      const date = new Date();
      faker.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const genre = faker.build();
      expect(genre.created_at.getTime()).toBe(date.getTime() + 2);

      const fakerMany = GenreFakeBuilder.theGenres(2);
      fakerMany.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const categories = fakerMany.build();

      expect(categories[0].created_at.getTime()).toBe(date.getTime() + 2);
      expect(categories[1].created_at.getTime()).toBe(date.getTime() + 3);
    });
  });

  it('should create a genre', () => {
    let faker = GenreFakeBuilder.aGenre();
    let genre = faker.build();

    expect(genre.genre_id).toBeInstanceOf(GenreId);
    expect(typeof genre.name === 'string').toBeTruthy();
    expect(genre.categories).toBeInstanceOf(Map);
    expect(genre.categories.size).toBe(1);
    expect(genre.categories.values().next().value).toBeInstanceOf(
      NestedCategory,
    );
    expect(genre.is_active).toBeTruthy();
    expect(genre.created_at).toBeInstanceOf(Date);

    const created_at = new Date();
    const genreId = new GenreId();
    const nestedCategory1 = Category.fake().aCategoryAndNested().build()[1];
    const nestedCategory2 = Category.fake().aCategoryAndNested().build()[1];
    faker = GenreFakeBuilder.aGenre();
    genre = faker
      .withGenreId(genreId)
      .withName('name test')
      .addNestedCategory(nestedCategory1)
      .addNestedCategory(nestedCategory2)
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    expect(genre.genre_id.id).toBe(genreId.id);
    expect(genre.name).toBe('name test');
    expect(genre.categories.get(nestedCategory1.category_id.id)).toBe(
      nestedCategory1,
    );
    expect(genre.categories.get(nestedCategory2.category_id.id)).toBe(
      nestedCategory2,
    );
    expect(genre.is_active).toBeFalsy();
    expect(genre.created_at).toEqual(created_at);
  });

  it('should create many categories', () => {
    const faker = GenreFakeBuilder.theGenres(2);
    let genres = faker.build();
    genres.forEach((genre) => {
      expect(genre.genre_id).toBeInstanceOf(GenreId);
      expect(genre.categories).toBeInstanceOf(Map);
      expect(genre.categories.size).toBe(1);
      expect(genre.categories.values().next().value).toBeInstanceOf(
        NestedCategory,
      );
      expect(genre.is_active).toBeTruthy();
      expect(genre.created_at).toBeInstanceOf(Date);
    });

    const created_at = new Date();
    const genreId = new GenreId();
    const nestedCategory1 = Category.fake().aCategoryAndNested().build()[1];
    const nestedCategory2 = Category.fake().aCategoryAndNested().build()[1];
    genres = faker
      .withGenreId(genreId)
      .withName('name test')
      .addNestedCategory(nestedCategory1)
      .addNestedCategory(nestedCategory2)
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    genres.forEach((genre) => {
      expect(genre.genre_id.id).toBe(genreId.id);
      expect(genre.name).toBe('name test');
      expect(genre.categories).toBeInstanceOf(Map);
      expect(genre.categories.get(nestedCategory1.category_id.id)).toBe(
        nestedCategory1,
      );
      expect(genre.categories.get(nestedCategory2.category_id.id)).toBe(
        nestedCategory2,
      );
      expect(genre.is_active).toBeFalsy();
      expect(genre.created_at).toEqual(created_at);
    });
  });
});
