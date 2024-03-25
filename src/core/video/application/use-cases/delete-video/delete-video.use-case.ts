import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Video, VideoId } from '../../../domain/video.aggregate';
import { IVideoRepository } from '../../../domain/video.repository';

export class DeleteVideoUseCase implements IUseCase<string, void> {
  constructor(private genreRepository: IVideoRepository) {}

  async execute(id: string): Promise<void> {
    const genre = await this.genreRepository.findById(new VideoId(id));

    if (!genre) {
      throw new NotFoundError(id, Video);
    }

    genre.markAsDeleted();

    await this.genreRepository.update(genre);
  }
}
