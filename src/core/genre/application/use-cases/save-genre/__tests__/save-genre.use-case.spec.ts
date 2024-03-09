import { Category } from '../../../../../category/domain/category.aggregate';
import { CategoryInMemoryRepository } from '../../../../../category/infra/db/in-memory/category-in-memory.repository';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import { GenreInMemoryRepository } from '../../../../infra/db/in-memory/genre-in-memory.repository';
import { SaveGenreInput } from '../save-genre.input';
import { SaveGenreUseCase } from '../save-genre.use-case';

describe('SaveGenreUseCase Unit Tests', () => {
  let useCase: SaveGenreUseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;

  beforeEach(() => {
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    useCase = new SaveGenreUseCase(genreRepo, categoryRepo);
  });

  it('should call createGenre method when genre_id is not provided', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    useCase['createGenre'] = jest.fn();
    const input = new SaveGenreInput({
      genre_id: new GenreId().id,
      name: 'test',
      categories_id: [category.category_id.id],
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['createGenre']).toHaveBeenCalledTimes(1);
    expect(useCase['createGenre']).toHaveBeenCalledWith(input);
  });

  it('should call updateGenre method when genre_id is provided', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    useCase['updateGenre'] = jest.fn();
    const genre = Genre.fake().aGenre().build();
    genreRepo.insert(genre);
    const input = new SaveGenreInput({
      genre_id: genre.genre_id.id,
      name: 'test',
      categories_id: [category.category_id.id],
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['updateGenre']).toHaveBeenCalledTimes(1);
    expect(useCase['updateGenre']).toHaveBeenCalledWith(
      input,
      expect.any(Genre),
    );
  });

  describe('getCategoriesProps', () => {
    it('should throw an error when category is not found', async () => {
      try {
        await useCase['getCategoriesProps'](['fake id']);
        fail('should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toEqual([
          { categories_id: ['Category Not Found using ID fake id'] },
        ]);
      }
    });

    it('should return an array of NestedCategoryConstructorProps', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const categoriesProps = await useCase['getCategoriesProps']([
        category.category_id.id,
      ]);
      expect(categoriesProps).toStrictEqual([
        {
          category_id: category.category_id,
          name: category.name,
          is_active: category.is_active,
          created_at: category.created_at,
        },
      ]);
    });
  });

  describe('execute createGenre method', () => {
    it('should throw an error when entity is not valid', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const spyCreateGenre = jest.spyOn(useCase, 'createGenre' as any);
      const input = new SaveGenreInput({
        genre_id: new GenreId().id,
        name: 't'.repeat(256),
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
      expect(spyCreateGenre).toHaveBeenCalledTimes(1);
    });

    it('should create a genre', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const spyInsert = jest.spyOn(genreRepo, 'insert');
      const genreId = new GenreId().id;
      const input = new SaveGenreInput({
        genre_id: genreId,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genreId,
        name: 'test',
        categories: [
          {
            id: category.category_id.id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          },
        ],
        is_active: false,
        created_at: genreRepo.items[0].created_at,
      });
    });
  });

  describe('execute calling updateGenre method', () => {
    it('should throw an error when entity is not valid', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const genre = Genre.fake().aGenre().build();
      genreRepo.items.push(genre);
      const input = new SaveGenreInput({
        genre_id: genre.genre_id.id,
        name: 't'.repeat(256),
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
    });

    it('should update a genre', async () => {
      const spyUpdate = jest.spyOn(genreRepo, 'update');
      const genre = Genre.fake().aGenre().build();
      genreRepo.items.push(genre);
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const input = new SaveGenreInput({
        genre_id: genre.genre_id.id,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genreRepo.items[0].genre_id.id,
        name: 'test',
        categories: [
          {
            id: category.category_id.id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          },
        ],
        is_active: false,
        created_at: genreRepo.items[0].created_at,
      });
    });
  });
});
