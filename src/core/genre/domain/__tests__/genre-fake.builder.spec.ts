import { Chance } from 'chance';
import { GenreFakeBuilder } from '../genre-fake.builder';
import { GenreId } from '../genre.aggregate';
import { CategoryId } from '../../../category/domain/category.aggregate';

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

  describe('categories_id prop', () => {
    const faker = GenreFakeBuilder.aGenre();
    it('should be empty', () => {
      expect(faker['_categories_id']).toBeInstanceOf(Array);
    });

    test('withCategoryId', () => {
      const categoryId1 = new CategoryId();
      const $this = faker.addCategoryId(categoryId1);
      expect($this).toBeInstanceOf(GenreFakeBuilder);
      expect(faker['_categories_id']).toStrictEqual([categoryId1]);

      const categoryId2 = new CategoryId();
      faker.addCategoryId(() => categoryId2);

      expect([
        faker['_categories_id'][0],
        //@ts-expect-error _categories_id is callable
        faker['_categories_id'][1](),
      ]).toStrictEqual([categoryId1, categoryId2]);
    });

    it('should pass index to categories_id factory', () => {
      const categoriesId = [new CategoryId(), new CategoryId()];
      faker.addCategoryId((index) => categoriesId[index]);
      const genre = faker.build();

      expect(genre.categories_id.get(categoriesId[0].id)).toBe(categoriesId[0]);

      const fakerMany = GenreFakeBuilder.theGenres(2);
      fakerMany.addCategoryId((index) => categoriesId[index]);
      const genres = fakerMany.build();

      expect(genres[0].categories_id.get(categoriesId[0].id)).toBe(
        categoriesId[0],
      );

      expect(genres[1].categories_id.get(categoriesId[1].id)).toBe(
        categoriesId[1],
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
    expect(genre.categories_id).toBeInstanceOf(Map);
    expect(genre.categories_id.size).toBe(1);
    expect(genre.categories_id.values().next().value).toBeInstanceOf(
      CategoryId,
    );
    expect(genre.is_active).toBeTruthy();
    expect(genre.created_at).toBeInstanceOf(Date);

    const created_at = new Date();
    const genreId = new GenreId();
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    faker = GenreFakeBuilder.aGenre();
    genre = faker
      .withGenreId(genreId)
      .withName('name test')
      .addCategoryId(categoryId1)
      .addCategoryId(categoryId2)
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    expect(genre.genre_id.id).toBe(genreId.id);
    expect(genre.name).toBe('name test');
    expect(genre.categories_id.get(categoryId1.id)).toBe(categoryId1);
    expect(genre.categories_id.get(categoryId2.id)).toBe(categoryId2);
    expect(genre.is_active).toBeFalsy();
    expect(genre.created_at).toEqual(created_at);
  });

  it('should create many categories', () => {
    const faker = GenreFakeBuilder.theGenres(2);
    let genres = faker.build();
    genres.forEach((genre) => {
      expect(genre.genre_id).toBeInstanceOf(GenreId);
      expect(genre.categories_id).toBeInstanceOf(Map);
      expect(genre.categories_id.size).toBe(1);
      expect(genre.categories_id.values().next().value).toBeInstanceOf(
        CategoryId,
      );
      expect(genre.is_active).toBeTruthy();
      expect(genre.created_at).toBeInstanceOf(Date);
    });

    const created_at = new Date();
    const genreId = new GenreId();
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    genres = faker
      .withGenreId(genreId)
      .withName('name test')
      .addCategoryId(categoryId1)
      .addCategoryId(categoryId2)
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    genres.forEach((genre) => {
      expect(genre.genre_id.id).toBe(genreId.id);
      expect(genre.name).toBe('name test');
      expect(genre.categories_id).toBeInstanceOf(Map);
      expect(genre.categories_id.get(categoryId1.id)).toBe(categoryId1);
      expect(genre.categories_id.get(categoryId2.id)).toBe(categoryId2);
      expect(genre.is_active).toBeFalsy();
      expect(genre.created_at).toEqual(created_at);
    });
  });
});
