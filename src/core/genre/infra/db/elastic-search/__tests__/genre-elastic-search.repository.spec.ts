import {
  GenreElasticSearchMapper,
  GenreElasticSearchRepository,
} from '../genre-elastic-search';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import {
  GenreSearchParams,
  GenreSearchResult,
} from '../../../../domain/genre.repository';
import { Category } from '../../../../../category/domain/category.aggregate';

describe('GenreElasticSearchRepository Integration Tests', () => {
  const esHelper = setupElasticSearch();
  let repository: GenreElasticSearchRepository;

  beforeEach(async () => {
    repository = new GenreElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
  });

  test('should inserts a new entity', async () => {
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'Movie',
      categories_props: [Category.fake().aNestedCategory().build()],
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(genre);
    const entity = await repository.findById(genre.genre_id);
    expect(entity!.toJSON()).toStrictEqual(genre.toJSON());
  });

  test('should insert many entities', async () => {
    const genres = Genre.fake().theGenres(2).build();
    await repository.bulkInsert(genres);
    const { exists: foundGenres } = await repository.findByIds(
      genres.map((g) => g.genre_id),
    );
    expect(foundGenres.length).toBe(2);
    expect(foundGenres[0].toJSON()).toStrictEqual(genres[0].toJSON());
    expect(foundGenres[1].toJSON()).toStrictEqual(genres[1].toJSON());
  });

  it('should delete a entity', async () => {
    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);

    await repository.delete(entity.genre_id);
    const document = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.genre_id.id,
        },
      },
    });
    expect(document.hits.hits.length).toBe(0);

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await repository.delete(entity.genre_id);
    const document2 = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.genre_id.id,
        },
      },
    });
    expect(document2.hits.hits.length).toBe(0);
  });

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new GenreId());
    expect(entityFound).toBeNull();

    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);
    entityFound = await repository.findById(entity.genre_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entity.markAsDeleted();

    await repository.update(entity);
    await expect(repository.findById(entity.genre_id)).resolves.toBeNull();
  });

  it('should return all genres', async () => {
    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.findAll();
    expect(entities).toHaveLength(0);
  });

  it('should return a genres list by ids', async () => {
    const genres = Genre.fake().theGenres(2).build();

    await repository.bulkInsert(genres);
    const { exists: foundGenres } = await repository.findByIds(
      genres.map((g) => g.genre_id),
    );
    expect(foundGenres.length).toBe(2);
    expect(foundGenres[0].toJSON()).toStrictEqual(genres[0].toJSON());
    expect(foundGenres[1].toJSON()).toStrictEqual(genres[1].toJSON());

    genres[0].markAsDeleted();
    genres[1].markAsDeleted();

    Promise.all([
      await repository.update(genres[0]),
      await repository.update(genres[1]),
    ]);

    const { exists: foundGenres2 } = await repository.findByIds(
      genres.map((g) => g.genre_id),
    );
    expect(foundGenres2.length).toBe(0);
  });

  it('should return genre id that exists', async () => {
    const genre = Genre.fake().aGenre().build();
    await repository.insert(genre);

    await repository.insert(genre);
    const existsResult1 = await repository.existsById([genre.genre_id]);
    expect(existsResult1.exists[0]).toBeValueObject(genre.genre_id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const genreId1 = new GenreId();
    const genreId2 = new GenreId();
    const notExistsResult = await repository.existsById([genreId1, genreId2]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(genreId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(genreId2);

    const existsResult2 = await repository.existsById([
      genre.genre_id,
      genreId1,
    ]);

    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(genre.genre_id);
    expect(existsResult2.not_exists[0]).toBeValueObject(genreId1);

    genre.markAsDeleted();

    await repository.update(genre);
    const existsResult3 = await repository.existsById([genre.genre_id]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(genre.genre_id);
  });

  it('should throw error on update when a entity not found', async () => {
    const entity = Genre.fake().aGenre().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.genre_id.id, Genre),
    );

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.genre_id.id, Genre),
    );
  });

  it('should update a entity', async () => {
    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);

    entity.changeName('Movie updated');
    await repository.update(entity);

    const entityFound = await repository.findById(entity.genre_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const genreId = new GenreId();
    await expect(repository.delete(genreId)).rejects.toThrow(
      new NotFoundError(genreId.id, Genre),
    );
  });

  describe('search method tests', () => {
    it('should only apply paginate and order by created desc when other params are null', async () => {
      const genres = Genre.fake()
        .theGenres(16)
        .withName((index) => `Comedy ${index}`)
        .withCreatedAt((index) => new Date(new Date().getTime() + 100 + index))
        .build();
      await repository.bulkInsert(genres);
      const spyToEntity = jest.spyOn(GenreElasticSearchMapper, 'toEntity');

      const searchOutput = await repository.search(GenreSearchParams.create());
      expect(searchOutput).toBeInstanceOf(GenreSearchResult);
      expect(spyToEntity).toHaveBeenCalledTimes(15);
      expect(searchOutput.toJSON()).toMatchObject({
        total: 16,
        current_page: 1,
        last_page: 2,
        per_page: 15,
      });
      searchOutput.items.forEach((item) => {
        expect(item).toBeInstanceOf(Genre);
        expect(item.genre_id).toBeDefined();
      });
      const items = searchOutput.items.map((item) => item.toJSON());
      expect(items).toMatchObject(
        [...genres]
          .reverse()
          .slice(0, 15)
          .map((item) => item.toJSON()),
      );

      genres[0].markAsDeleted();

      await repository.update(genres[0]);

      const searchOutput2 = await repository.search(GenreSearchParams.create());
      expect(searchOutput2).toBeInstanceOf(GenreSearchResult);
      expect(searchOutput2.toJSON()).toMatchObject({
        total: 15,
        current_page: 1,
        last_page: 1,
        per_page: 15,
      });
    });

    it('should apply paginate and filter by name', async () => {
      const nestedCategories = Category.fake().theNestedCategories(3).build();
      const genres = [
        Genre.fake()
          .aGenre()
          .withName('test')
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .build(),
        Genre.fake()
          .aGenre()
          .withName('a')
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .build(),
        Genre.fake()
          .aGenre()
          .withName('TEST')
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .build(),
        Genre.fake()
          .aGenre()
          .withName('TeSt')
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .build(),
      ];
      await repository.bulkInsert(genres);

      let searchOutput = await repository.search(
        GenreSearchParams.create({
          page: 1,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );

      let expected = new GenreSearchResult({
        items: [genres[0], genres[2]],
        total: 3,
        current_page: 1,
        per_page: 2,
      }).toJSON(true);
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
          },
          {
            ...expected.items[1],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
          },
        ],
      });

      expected = new GenreSearchResult({
        items: [genres[3]],
        total: 3,
        current_page: 2,
        per_page: 2,
      }).toJSON(true);
      searchOutput = await repository.search(
        GenreSearchParams.create({
          page: 2,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
          },
        ],
      });
    });

    it('should apply paginate and filter by categories_id', async () => {
      const nestedCategories = Category.fake().theNestedCategories(4).build();
      const genres = [
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[3])
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
      ];
      await repository.bulkInsert(genres);

      const arrange = [
        {
          params: GenreSearchParams.create({
            page: 1,
            per_page: 2,
            filter: { categories_id: [nestedCategories[0].category_id.id] },
          }),
          result: {
            items: [genres[2], genres[1]],
            total: 3,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: GenreSearchParams.create({
            page: 2,
            per_page: 2,
            filter: { categories_id: [nestedCategories[0].category_id.id] },
          }),
          result: {
            items: [genres[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
          },
        },
        {
          params: GenreSearchParams.create({
            page: 1,
            per_page: 2,
            filter: {
              categories_id: [
                nestedCategories[0].category_id.id,
                nestedCategories[1].category_id.id,
              ],
            },
          }),
          result: {
            items: [genres[4], genres[2]],
            total: 4,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: GenreSearchParams.create({
            page: 2,
            per_page: 2,
            filter: {
              categories_id: [
                nestedCategories[0].category_id.id,
                nestedCategories[1].category_id.id,
              ],
            },
          }),
          result: {
            items: [genres[1], genres[0]],
            total: 4,
            current_page: 2,
            per_page: 2,
          },
        },
      ];
      for (const arrangeItem of arrange) {
        const searchOutput = await repository.search(arrangeItem.params);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { items, ...otherOutput } = searchOutput;
        const { items: itemsExpected, ...otherExpected } = arrangeItem.result;
        expect(otherOutput).toMatchObject(otherExpected);
        expect(searchOutput.items.length).toBe(itemsExpected.length);
        searchOutput.items.forEach((item, key) => {
          const expected = itemsExpected[key].toJSON();
          expect(item.toJSON()).toStrictEqual(
            expect.objectContaining({
              ...expected,
              categories: expect.arrayContaining(expected.categories),
            }),
          );
        });
      }
    });

    it('should apply paginate and sort', async () => {
      expect(repository.sortableFields).toStrictEqual(['name', 'created_at']);

      const nestedCategories = Category.fake().theNestedCategories(4).build();
      const genres = [
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withName('b')
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withName('a')
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withName('d')
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withName('e')
          .build(),
        Genre.fake()
          .aGenre()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .withName('c')
          .build(),
      ];
      await repository.bulkInsert(genres);

      const arrange = [
        {
          params: GenreSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
          }),
          result: new GenreSearchResult({
            items: [genres[1], genres[0]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: GenreSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
          }),
          result: new GenreSearchResult({
            items: [genres[4], genres[2]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
        {
          params: GenreSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new GenreSearchResult({
            items: [genres[3], genres[2]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: GenreSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new GenreSearchResult({
            items: [genres[4], genres[0]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
      ];

      for (const i of arrange) {
        const result = await repository.search(i.params);
        const expected = i.result.toJSON(true);

        expect(result.toJSON(true)).toMatchObject({
          ...expected,
          items: expected.items.map((i) => ({
            ...i,
            categories: expect.arrayContaining(i.categories),
          })),
        });
      }
    });
  });
});
