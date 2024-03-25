import { IUseCase } from '../../../../shared/application/use-case-interface';
import { IVideoRepository } from '../../../domain/video.repository';
import { Video, VideoId } from '../../../domain/video.aggregate';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { SaveVideoInput } from './save-video.input';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { ICategoryRepository } from '../../../../category/domain/category.repository';
import {
  Category,
  CategoryId,
} from '../../../../category/domain/category.aggregate';
import { NestedCategoryConstructorProps } from '../../../../category/domain/nested-category.entity';
import { Rating } from '../../../domain/rating.vo';
import { NestedGenreConstructorProps } from '../../../../genre/domain/nested-genre.entity';
import { Genre, GenreId } from '../../../../genre/domain/genre.aggregate';
import { ICastMemberRepository } from '../../../../cast-member/domain/cast-member.repository';
import { IGenreRepository } from '../../../../genre/domain/genre.repository';
import { NestedCastMemberConstructorProps } from '../../../../cast-member/domain/nested-cast-member.entity';
import { CastMember, CastMemberId } from '../../../../cast-member/domain/cast-member.aggregate';

export class SaveVideoUseCase
  implements IUseCase<SaveVideoInput, SaveVideoOutput>
{
  constructor(
    private videoRepo: IVideoRepository,
    private categoryRepo: ICategoryRepository,
    private genreRepo: IGenreRepository,
    private castMemberRepo: ICastMemberRepository,
  ) {}

  async execute(input: SaveVideoInput): Promise<SaveVideoOutput> {
    const genreId = new VideoId(input.video_id);
    const genre = await this.videoRepo.findById(genreId);

    return genre ? this.updateVideo(input, genre) : this.createVideo(input);
  }

  private async createVideo(input: SaveVideoInput) {
    const [rating, errorRating] = Rating.create(input.rating).asArray();

    if (errorRating) {
      throw new EntityValidationError([
        {
          rating: [errorRating.message],
        },
      ]);
    }

    const nestedCategoriesProps = await this.getCategoriesProps(
      input.categories_id,
    );
    const nestedGenresProps = await this.getGenresProps(input.genres_id);
    const nestedCastMembersProps = await this.getCastMembersProps(
      input.cast_members_id,
    );

    const entity = Video.create({
      video_id: new VideoId(input.video_id),
      title: input.title,
      description: input.description,
      year_launched: input.year_launched,
      duration: input.duration,
      rating,
      is_opened: input.is_opened,
      is_published: input.is_published,

      banner_url: input.banner_url,
      thumbnail_url: input.thumbnail_url,
      thumbnail_half_url: input.thumbnail_half_url,

      trailer_url: input.trailer_url,
      video_url: input.video_url,

      categories_props: nestedCategoriesProps,
      genres_props: nestedGenresProps,
      cast_members_props: nestedCastMembersProps,
      created_at: input.created_at,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.videoRepo.insert(entity);
    return { id: entity.video_id.id, created: true };
  }

  private async updateVideo(input: SaveVideoInput, video: Video) {
    if (!video) {
      throw new NotFoundError(input.video_id, Video);
    }

    video.changeTitle(input.title);
    video.changeDescription(input.description);
    video.changeYearLaunched(input.year_launched);
    video.changeDuration(input.duration);

    const [rating, errorRating] = Rating.create(input.rating).asArray();

    if (errorRating) {
      throw new EntityValidationError([
        {
          rating: [errorRating.message],
        },
      ]);
    }

    video.changeRating(rating);

    input.is_opened ? video.markAsOpened() : video.markAsNotOpened();
    input.is_published ? video.publish() : video.unpublish();

    video.replaceBannerUrl(input.banner_url);
    video.replaceThumbnailUrl(input.thumbnail_url);
    video.replaceThumbnailHalfUrl(input.thumbnail_half_url);
    video.replaceTrailerUrl(input.trailer_url);
    video.replaceVideoUrl(input.video_url);

    const nestedCategoriesProps = await this.getCategoriesProps(
      input.categories_id,
    );
    video.syncNestedCategories(nestedCategoriesProps);

    const nestedGenresProps = await this.getGenresProps(input.genres_id);
    video.syncNestedGenres(nestedGenresProps);

    const nestedCastMembersProps = await this.getCastMembersProps(
      input.cast_members_id,
    );
    video.syncNestedCastMembers(nestedCastMembersProps);

    video.changeCreatedAt(input.created_at);

    if (video.notification.hasErrors()) {
      throw new EntityValidationError(video.notification.toJSON());
    }

    await this.videoRepo.update(video);

    return { id: video.video_id.id, created: false };
  }

  private async getCategoriesProps(
    categoriesIds: string[],
  ): Promise<NestedCategoryConstructorProps[]> {
    const { exists: categoriesExists, not_exists: notCategoriesExists } =
      await this.categoryRepo.findByIds(
        categoriesIds.map((c) => new CategoryId(c)),
      );

    if (notCategoriesExists.length > 0) {
      throw new EntityValidationError([
        {
          categories_id: notCategoriesExists.map(
            (c) => new NotFoundError(c.id, Category).message,
          ),
        },
      ]);
    }

    return categoriesExists.map((c) => ({
      category_id: c.category_id,
      name: c.name,
      is_active: c.is_active,
      created_at: c.created_at,
    }));
  }

  private async getGenresProps(
    genresIds: string[],
  ): Promise<NestedGenreConstructorProps[]> {
    const { exists: genresExists, not_exists: notGenresExists } =
      await this.genreRepo.findByIds(genresIds.map((c) => new GenreId(c)));

    if (notGenresExists.length > 0) {
      throw new EntityValidationError([
        {
          genres_id: notGenresExists.map(
            (c) => new NotFoundError(c.id, Genre).message,
          ),
        },
      ]);
    }

    return genresExists.map((g) => ({
      genre_id: g.genre_id,
      name: g.name,
      is_active: g.is_active,
      created_at: g.created_at,
    }));
  }

  private async getCastMembersProps(
    castMembersIds: string[],
  ): Promise<NestedCastMemberConstructorProps[]> {
    const { exists: castMembersExists, not_exists: notCastMembersExists } =
      await this.castMemberRepo.findByIds(
        castMembersIds.map((c) => new CastMemberId(c)),
      );

    if (notCastMembersExists.length > 0) {
      throw new EntityValidationError([
        {
          cast_members_id: notCastMembersExists.map(
            (c) => new NotFoundError(c.id, CastMember).message,
          ),
        },
      ]);
    }

    return castMembersExists.map((c) => ({
      cast_member_id: c.cast_member_id,
      name: c.name,
      type: c.type,
      created_at: c.created_at,
    }));
  }
}

export type SaveVideoOutput = { id: string; created: boolean };
