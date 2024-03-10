import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import { IGenreRepository } from '../../../domain/genre.repository';

export class DeleteGenreUseCase implements IUseCase<string, void> {
  constructor(private genreRepository: IGenreRepository) {}

  async execute(id: string): Promise<void> {
    const genre = await this.genreRepository.findById(new GenreId(id));

    if (!genre) {
      throw new NotFoundError(id, Genre);
    }

    genre.markAsDeleted();

    await this.genreRepository.update(genre);
  }
}
