import { CategoryId } from '../../../../../category/domain/category.aggregate';
import { Genre, GenreId } from '../../../../domain/genre.aggregate';
import {
  GENRE_DOCUMENT_TYPE_NAME,
  GenreDocument,
  GenreElasticSearchMapper,
} from '../genre-elastic-search';

describe('GenreElasticSearchMapper', () => {
  let genreDocument: GenreDocument;
  let genre: Genre;

  beforeEach(() => {
    genreDocument = {
      genre_name: 'Test',
      categories: [new CategoryId().id],
      is_active: true,
      created_at: new Date(),
      deleted_at: null,
      type: GENRE_DOCUMENT_TYPE_NAME,
    };
    const id = new GenreId();

    genre = new Genre({
      genre_id: id,
      name: genreDocument.genre_name,
      categories_id: new Map(
        genreDocument.categories.map((category_id) => [
          category_id,
          new CategoryId(category_id),
        ]),
      ),
      is_active: genreDocument.is_active,
      created_at: genreDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = GenreElasticSearchMapper.toEntity(
        genre.genre_id.id,
        genreDocument,
      );
      expect(result).toEqual(genre);

      genreDocument.deleted_at = new Date();
      genre.deleted_at = genreDocument.deleted_at;

      const result2 = GenreElasticSearchMapper.toEntity(
        genre.genre_id.id,
        genreDocument,
      );
      expect(result2).toEqual(genre);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = GenreElasticSearchMapper.toDocument(genre);
      expect(result).toEqual(genreDocument);

      genre.deleted_at = new Date();
      genreDocument.deleted_at = genre.deleted_at;

      const result2 = GenreElasticSearchMapper.toDocument(genre);
      expect(result2).toEqual(genreDocument);
    });
  });
});
