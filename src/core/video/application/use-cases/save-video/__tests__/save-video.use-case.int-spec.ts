import { SaveVideoUseCase } from '../save-video.use-case';

import { Video, VideoId } from '../../../../domain/video.aggregate';
import { SaveVideoInput } from '../save-video.input';
import { VideoElasticSearchRepository } from '../../../../infra/db/elastic-search/video-elastic-search';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import { CategoryElasticSearchRepository } from '../../../../../category/infra/db/elastic-search/category-elastic-search';
import { Category } from '../../../../../category/domain/category.aggregate';
import { NestedCategory } from '../../../../../category/domain/nested-category.entity';
import { GenreElasticSearchRepository } from '../../../../../genre/infra/db/elastic-search/genre-elastic-search';
import { CastMemberElasticSearchRepository } from '../../../../../cast-member/infra/db/elastic-search/cast-member-elastic-search';
import { Genre } from '../../../../../genre/domain/genre.aggregate';
import { CastMember } from '../../../../../cast-member/domain/cast-member.aggregate';
import { Rating, RatingValues } from '../../../../domain/rating.vo';
import { NestedGenre } from '../../../../../genre/domain/nested-genre.entity';
import { NestedCastMember } from '../../../../../cast-member/domain/nested-cast-member.entity';

describe('SaveVideoUseCase Integration Tests', () => {
  let useCase: SaveVideoUseCase;
  let videoRepo: VideoElasticSearchRepository;
  let categoryRepo: CategoryElasticSearchRepository;
  let genreRepo: GenreElasticSearchRepository;
  let castMemberRepo: CastMemberElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    videoRepo = new VideoElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    categoryRepo = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    genreRepo = new GenreElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    castMemberRepo = new CastMemberElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new SaveVideoUseCase(
      videoRepo,
      categoryRepo,
      genreRepo,
      castMemberRepo,
    );
  });

  it('should create a genre', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const genre = Genre.fake().aGenre().build();
    await genreRepo.insert(genre);
    const castMember = CastMember.fake().anActor().build();
    await castMemberRepo.insert(castMember);
    const uuid = '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e';
    const created_at = new Date();
    const output = await useCase.execute(
      new SaveVideoInput({
        video_id: uuid,
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
      }),
    );
    expect(output).toStrictEqual({
      id: uuid,
      created: true,
    });
    const entity = await videoRepo.findById(new VideoId(uuid));
    expect(entity).toMatchObject({
      title: 'test',
      description: 'test',
      year_launched: 2020,
      duration: 90,
      rating: Rating.create10(),
      is_opened: false,
      is_published: false,
      banner_url: 'test',
      thumbnail_url: 'test',
      thumbnail_half_url: 'test',
      trailer_url: 'test',
      video_url: 'test',
      categories: new Map([
        [
          category.category_id.id,
          new NestedCategory({
            category_id: category.category_id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      genres: new Map([
        [
          genre.genre_id.id,
          new NestedGenre({
            genre_id: genre.genre_id,
            name: genre.name,
            is_active: genre.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      cast_members: new Map([
        [
          castMember.cast_member_id.id,
          new NestedCastMember({
            cast_member_id: castMember.cast_member_id,
            name: castMember.name,
            type: castMember.type,
            deleted_at: null,
          }),
        ],
      ]),
      created_at,
    });
  });

  it('should update a genre', async () => {
    const created_at = new Date();
    const video = Video.fake().aVideoWithAllMedias().build();
    await videoRepo.insert(video);
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const genre = Genre.fake().aGenre().build();
    await genreRepo.insert(genre);
    const castMember = CastMember.fake().anActor().build();
    await castMemberRepo.insert(castMember);
    const output = await useCase.execute(
      new SaveVideoInput({
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
        created_at,
      }),
    );
    expect(output).toStrictEqual({
      id: video.video_id.id,
      created: false,
    });
    const entity = await videoRepo.findById(video.video_id);
    expect(entity).toMatchObject({
      title: 'test',
      description: 'test',
      year_launched: 2020,
      duration: 90,
      rating: Rating.create10(),
      is_opened: false,
      is_published: false,
      banner_url: 'test',
      thumbnail_url: 'test',
      thumbnail_half_url: 'test',
      trailer_url: 'test',
      video_url: 'test',
      categories: new Map([
        [
          category.category_id.id,
          new NestedCategory({
            category_id: category.category_id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      genres: new Map([
        [
          genre.genre_id.id,
          new NestedGenre({
            genre_id: genre.genre_id,
            name: genre.name,
            is_active: genre.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      cast_members: new Map([
        [
          castMember.cast_member_id.id,
          new NestedCastMember({
            cast_member_id: castMember.cast_member_id,
            name: castMember.name,
            type: castMember.type,
            deleted_at: null,
          }),
        ],
      ]),
      created_at,
    });
  });
});
