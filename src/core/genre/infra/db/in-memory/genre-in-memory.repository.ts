import { InMemoryRepository } from '../../../../shared/domain/repository/in-memory.repository';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import { IGenreRepository } from '../../../domain/genre.repository';

export class GenreInMemoryRepository
  extends InMemoryRepository<Genre, GenreId>
  implements IGenreRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => Genre {
    return Genre;
  }
}
