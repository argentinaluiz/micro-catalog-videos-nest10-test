import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import { VideoInMemoryRepository } from '../../../../infra/db/in-memory/video-in-memory.repository';
import { DeleteVideoUseCase } from '../delete-video.use-case';

describe('DeleteVideoUseCase Unit Tests', () => {
  let useCase: DeleteVideoUseCase;
  let repository: VideoInMemoryRepository;

  beforeEach(() => {
    repository = new VideoInMemoryRepository();
    useCase = new DeleteVideoUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const videoId = new VideoId();

    await expect(() => useCase.execute(videoId.id)).rejects.toThrow(
      new NotFoundError(videoId.id, Video),
    );
  });

  it('should delete a genre', async () => {
    const items = [Video.fake().aVideoWithAllMedias().build()];
    repository.items = items;
    await useCase.execute(items[0].video_id.id);
    expect(repository.ignoreSoftDeleted().findAll()).resolves.toHaveLength(0);
  });
});
