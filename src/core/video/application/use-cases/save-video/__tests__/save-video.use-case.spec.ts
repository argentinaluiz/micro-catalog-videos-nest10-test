import {
  CastMember,
  CastMemberId,
} from '../../../../../cast-member/domain/cast-member.aggregate';
import { CastMemberInMemoryRepository } from '../../../../../cast-member/infra/db/in-memory/cast-member-in-memory.repository';
import {
  Category,
  CategoryId,
} from '../../../../../category/domain/category.aggregate';
import { CategoryInMemoryRepository } from '../../../../../category/infra/db/in-memory/category-in-memory.repository';
import { Genre, GenreId } from '../../../../../genre/domain/genre.aggregate';
import { GenreInMemoryRepository } from '../../../../../genre/infra/db/in-memory/genre-in-memory.repository';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { RatingValues } from '../../../../domain/rating.vo';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import { VideoInMemoryRepository } from '../../../../infra/db/in-memory/video-in-memory.repository';
import { SaveVideoInput } from '../save-video.input';
import { SaveVideoUseCase } from '../save-video.use-case';

describe('SaveVideoUseCase Unit Tests', () => {
  let useCase: SaveVideoUseCase;
  let videoRepo: VideoInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;
  let genreRepo: GenreInMemoryRepository;
  let castMemberRepo: CastMemberInMemoryRepository;

  beforeEach(() => {
    videoRepo = new VideoInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    genreRepo = new GenreInMemoryRepository();
    castMemberRepo = new CastMemberInMemoryRepository();
    useCase = new SaveVideoUseCase(
      videoRepo,
      categoryRepo,
      genreRepo,
      castMemberRepo,
    );
  });

  it('should call createVideo method when video not exists in database', async () => {
    useCase['createVideo'] = jest.fn();
    const input = new SaveVideoInput({
      video_id: new VideoId().id,
      title: 'test',
      description: 'test',
      year_launched: 2020,
      duration: 90,
      rating: RatingValues.R10,
      is_opened: false,
      is_published: false,
      banner_url: 'test',
      thumbnail_url: 'test',
      thumbnail_half_url: 'test',
      trailer_url: 'test',
      video_url: 'test',
      categories_id: [new CategoryId().id],
      genres_id: [new GenreId().id],
      cast_members_id: [new CastMemberId().id],
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['createVideo']).toHaveBeenCalledTimes(1);
    expect(useCase['createVideo']).toHaveBeenCalledWith(input);
  });

  it('should call updateVideo method when video exists in database', async () => {
    useCase['updateVideo'] = jest.fn();
    const video = Video.fake().aVideoWithAllMedias().build();
    videoRepo.insert(video);
    const input = new SaveVideoInput({
      video_id: video.video_id.id,
      title: 'test',
      description: 'test',
      year_launched: 2020,
      duration: 90,
      rating: RatingValues.R10,
      is_opened: false,
      is_published: false,
      banner_url: 'test',
      thumbnail_url: 'test',
      thumbnail_half_url: 'test',
      trailer_url: 'test',
      video_url: 'test',
      categories_id: [new CategoryId().id],
      genres_id: [new GenreId().id],
      cast_members_id: [new CastMemberId().id],
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['updateVideo']).toHaveBeenCalledTimes(1);
    expect(useCase['updateVideo']).toHaveBeenCalledWith(
      input,
      expect.any(Video),
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

  describe('getGenresProps', () => {
    it('should throw an error when genre is not found', async () => {
      try {
        await useCase['getGenresProps'](['fake id']);
        fail('should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toEqual([
          { genres_id: ['Genre Not Found using ID fake id'] },
        ]);
      }
    });

    it('should return an array of NestedGenreConstructorProps', async () => {
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const genresProps = await useCase['getGenresProps']([genre.genre_id.id]);
      expect(genresProps).toStrictEqual([
        {
          genre_id: genre.genre_id,
          name: genre.name,
          is_active: genre.is_active,
          created_at: genre.created_at,
        },
      ]);
    });
  });

  describe('getCastMembersProps', () => {
    it('should throw an error when cast member is not found', async () => {
      try {
        await useCase['getCastMembersProps'](['fake id']);
        fail('should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(EntityValidationError);
        expect(e.error).toEqual([
          { cast_members_id: ['CastMember Not Found using ID fake id'] },
        ]);
      }
    });

    it('should return an array of NestedCastMemberConstructorProps', async () => {
      const castMember = CastMember.fake().anActor().build();
      await castMemberRepo.insert(castMember);
      const castMembersProps = await useCase['getCastMembersProps']([
        castMember.cast_member_id.id,
      ]);
      expect(castMembersProps).toStrictEqual([
        {
          cast_member_id: castMember.cast_member_id,
          name: castMember.name,
          type: castMember.type,
          created_at: castMember.created_at,
        },
      ]);
    });
  });

  describe('execute createVideo method', () => {
    it('should throw an error when entity is not valid', async () => {
      const spyCreateVideo = jest.spyOn(useCase, 'createVideo' as any);
      const input = new SaveVideoInput({
        video_id: new VideoId().id,
        title: 'test',
        description: 'test',
        year_launched: 2020,
        duration: 90,
        rating: RatingValues.R10,
        is_opened: false,
        is_published: false,
        banner_url: 'test',
        thumbnail_url: 'test',
        thumbnail_half_url: 'test',
        trailer_url: 'test',
        video_url: 'test',
        categories_id: [new CategoryId().id],
        genres_id: [new GenreId().id],
        cast_members_id: [new CastMemberId().id],
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
      expect(spyCreateVideo).toHaveBeenCalledTimes(1);
    });

    it('should create a genre', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const castMember = CastMember.fake().anActor().build();
      await castMemberRepo.insert(castMember);
      const spyInsert = jest.spyOn(videoRepo, 'insert');
      const videoId = new VideoId().id;
      const input = new SaveVideoInput({
        video_id: videoId,
        title: 'test',
        description: 'test',
        year_launched: 2020,
        duration: 90,
        rating: RatingValues.R10,
        is_opened: false,
        is_published: false,
        banner_url: 'test',
        thumbnail_url: 'test',
        thumbnail_half_url: 'test',
        trailer_url: 'test',
        video_url: 'test',
        categories_id: [category.category_id.id],
        genres_id: [genre.genre_id.id],
        cast_members_id: [castMember.cast_member_id.id],
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: videoId,
        created: true,
      });
    });
  });

  describe('execute calling updateVideo method', () => {
    it('should throw an error when entity is not valid', async () => {
      const video = Video.fake().aVideoWithAllMedias().build();
      videoRepo.items.push(video);
      const input = new SaveVideoInput({
        video_id: video.video_id.id,
        title: 'test',
        description: 'test',
        year_launched: 2020,
        duration: 90,
        rating: RatingValues.R10,
        is_opened: false,
        is_published: false,
        banner_url: 'test',
        thumbnail_url: 'test',
        thumbnail_half_url: 'test',
        trailer_url: 'test',
        video_url: 'test',
        categories_id: [new CategoryId().id],
        genres_id: [new GenreId().id],
        cast_members_id: [new CastMemberId().id],
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError(
        'Entity Validation Error',
      );
    });

    it('should update a video', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const genre = Genre.fake().aGenre().build();
      await genreRepo.insert(genre);
      const castMember = CastMember.fake().anActor().build();
      await castMemberRepo.insert(castMember);

      const spyUpdate = jest.spyOn(videoRepo, 'update');
      const video = Video.fake().aVideoWithAllMedias().build();
      videoRepo.items.push(video);
      const input = new SaveVideoInput({
        video_id: video.video_id.id,
        title: 'test',
        description: 'test',
        year_launched: 2020,
        duration: 90,
        rating: RatingValues.R10,
        is_opened: false,
        is_published: false,
        banner_url: 'test',
        thumbnail_url: 'test',
        thumbnail_half_url: 'test',
        trailer_url: 'test',
        video_url: 'test',
        categories_id: [category.category_id.id],
        genres_id: [genre.genre_id.id],
        cast_members_id: [castMember.cast_member_id.id],
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: videoRepo.items[0].video_id.id,
        created: false,
      });
    });
  });
});
