import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import { IGenreRepository } from '../../../domain/genre.repository';

export class DeleteGenreUseCase
  implements IUseCase<DeleteGenreInput, DeleteGenreOutput>
{
  constructor(private genreRepository: IGenreRepository) {}

  async execute(input: DeleteGenreInput): Promise<DeleteGenreOutput> {
    const genre = await this.genreRepository.findById(new GenreId(input.id));

    if (!genre) {
      throw new NotFoundError(input.id, Genre);
    }

    genre.markAsDeleted();

    await this.genreRepository.update(genre);
  }
}

export type DeleteGenreInput = {
  id: string;
};

type DeleteGenreOutput = void;
