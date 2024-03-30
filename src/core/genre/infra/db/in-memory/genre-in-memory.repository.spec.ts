import { Genre } from '../../../domain/genre.aggregate';
import { GenreInMemoryRepository } from './genre-in-memory.repository';

describe('GenreInMemoryRepository', () => {
  let repository: GenreInMemoryRepository;

  beforeEach(() => (repository = new GenreInMemoryRepository()));

  it('should getEntity return Genre Entity', async () => {
    expect(repository.getEntity()).toStrictEqual(Genre);
  });
});
