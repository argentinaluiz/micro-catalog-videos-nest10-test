import { GenreElasticSearchRepository } from '../genre-elastic-search';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
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

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new GenreId());
    expect(entityFound).toBeNull();

    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);
    entityFound = await repository.findById(entity.genre_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entity.markAsDeleted();

    await repository.update(entity);
    await expect(
      repository.ignoreSoftDeleted().findById(entity.genre_id),
    ).resolves.toBeNull();
  });

  it('should return all genres', async () => {
    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.ignoreSoftDeleted().findAll();
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

    const { exists: foundGenres2 } = await repository
      .ignoreSoftDeleted()
      .findByIds(genres.map((g) => g.genre_id));
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
    const existsResult3 = await repository
      .ignoreSoftDeleted()
      .existsById([genre.genre_id]);
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

    await expect(repository.ignoreSoftDeleted().update(entity)).rejects.toThrow(
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

    const entity = Genre.fake().aGenre().build();
    await repository.insert(entity);

    entity.markAsDeleted();
    await repository.update(entity);

    await expect(
      repository.ignoreSoftDeleted().delete(entity.genre_id),
    ).rejects.toThrow(new NotFoundError(entity.genre_id.id, Genre));
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
});
