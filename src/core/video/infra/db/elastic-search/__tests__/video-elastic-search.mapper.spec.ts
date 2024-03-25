import {
  CastMemberType,
  CastMemberTypes,
} from '../../../../../cast-member/domain/cast-member-type.vo';
import { CastMemberId } from '../../../../../cast-member/domain/cast-member.aggregate';
import { NestedCastMember } from '../../../../../cast-member/domain/nested-cast-member.entity';
import { CategoryId } from '../../../../../category/domain/category.aggregate';
import { NestedCategory } from '../../../../../category/domain/nested-category.entity';
import { GenreId } from '../../../../../genre/domain/genre.aggregate';
import { NestedGenre } from '../../../../../genre/domain/nested-genre.entity';
import { Rating } from '../../../../domain/rating.vo';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import {
  VIDEO_DOCUMENT_TYPE_NAME,
  VideoDocument,
  VideoElasticSearchMapper,
} from '../video-elastic-search';

describe('VideoElasticSearchMapper', () => {
  let videoDocument: VideoDocument;
  let video: Video;

  beforeEach(() => {
    videoDocument = {
      video_title: 'Test title',
      video_title_keyword: 'Test title',
      video_description: 'Test description',
      year_launched: 2021,
      duration: 120,
      rating: 'L',
      is_opened: true,
      is_published: true,
      banner_url: 'http://banner.com',
      thumbnail_url: 'http://thumbnail.com',
      thumbnail_half_url: 'http://thumbnail_half.com',
      trailer_url: 'http://trailer.com',
      video_url: 'http://video.com',
      categories: [
        {
          id: '6b4f4b3b-1b7b-4b6b-8b1b-7b4b3b1b7b4b',
          name: 'Test',
          is_active: true,
          deleted_at: null,
        },
      ],
      genres: [
        {
          id: '6b4f4b3b-1b7b-4b6b-8b1b-7b4b3b1b7b4b',
          name: 'Test',
          is_active: true,
          deleted_at: null,
        },
      ],
      cast_members: [
        {
          id: '6b4f4b3b-1b7b-4b6b-8b1b-7b4b3b1b7b4b',
          name: 'Test',
          cast_member_type: CastMemberTypes.ACTOR,
          deleted_at: null,
        },
      ],
      created_at: new Date(),
      deleted_at: null,
      type: VIDEO_DOCUMENT_TYPE_NAME,
    };
    const id = new VideoId();

    video = new Video({
      video_id: id,
      title: videoDocument.video_title,
      description: videoDocument.video_description,
      year_launched: videoDocument.year_launched,
      duration: videoDocument.duration,
      rating: Rating.create(videoDocument.rating as any).ok,
      is_opened: videoDocument.is_opened,
      is_published: videoDocument.is_published,
      banner_url: videoDocument.banner_url,
      thumbnail_url: videoDocument.thumbnail_url,
      thumbnail_half_url: videoDocument.thumbnail_half_url,
      trailer_url: videoDocument.trailer_url,
      video_url: videoDocument.video_url,
      categories: new Map(
        videoDocument.categories
          .map(
            (category) =>
              new NestedCategory({
                category_id: new CategoryId(category.id),
                name: category.name,
                is_active: category.is_active,
                deleted_at: category.deleted_at as null,
              }),
          )
          .map((category) => [category.category_id.id, category]),
      ),
      genres: new Map(
        videoDocument.genres
          .map(
            (genre) =>
              new NestedGenre({
                genre_id: new GenreId(genre.id),
                name: genre.name,
                is_active: genre.is_active,
                deleted_at: genre.deleted_at as null,
              }),
          )
          .map((genre) => [genre.genre_id.id, genre]),
      ),
      cast_members: new Map(
        videoDocument.cast_members
          .map(
            (castMember) =>
              new NestedCastMember({
                cast_member_id: new CastMemberId(castMember.id),
                name: castMember.name,
                type: CastMemberType.create(castMember.cast_member_type).ok,
                deleted_at: castMember.deleted_at as null,
              }),
          )
          .map((castMember) => [castMember.cast_member_id.id, castMember]),
      ),
      created_at: videoDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = VideoElasticSearchMapper.toEntity(
        video.video_id.id,
        videoDocument,
      );
      expect(result).toEqual(video);

      videoDocument.deleted_at = new Date();
      video.deleted_at = videoDocument.deleted_at;

      const result2 = VideoElasticSearchMapper.toEntity(
        video.video_id.id,
        videoDocument,
      );
      expect(result2).toEqual(video);

      videoDocument.categories[0].deleted_at = new Date();
      video.categories.get(videoDocument.categories[0].id)!.deleted_at =
        videoDocument.categories[0].deleted_at;

      videoDocument.genres[0].deleted_at = new Date();
      video.genres.get(videoDocument.genres[0].id)!.deleted_at =
        videoDocument.genres[0].deleted_at;

      videoDocument.cast_members[0].deleted_at = new Date();
      video.cast_members.get(videoDocument.cast_members[0].id)!.deleted_at =
        videoDocument.cast_members[0].deleted_at;

      const result3 = VideoElasticSearchMapper.toEntity(
        video.video_id.id,
        videoDocument,
      );
      expect(result3).toEqual(video);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = VideoElasticSearchMapper.toDocument(video);
      expect(result).toEqual(videoDocument);

      video.deleted_at = new Date();
      videoDocument.deleted_at = video.deleted_at;

      const result2 = VideoElasticSearchMapper.toDocument(video);
      expect(result2).toEqual(videoDocument);

      video.categories.get(videoDocument.categories[0].id)!.deleted_at =
        new Date();
      videoDocument.categories[0].deleted_at = video.categories.get(
        videoDocument.categories[0].id,
      )!.deleted_at;

      video.genres.get(videoDocument.genres[0].id)!.deleted_at = new Date();
      videoDocument.genres[0].deleted_at = video.genres.get(
        videoDocument.genres[0].id,
      )!.deleted_at;

      video.cast_members.get(videoDocument.cast_members[0].id)!.deleted_at =
        new Date();
      videoDocument.cast_members[0].deleted_at = video.cast_members.get(
        videoDocument.cast_members[0].id,
      )!.deleted_at;

      const result3 = VideoElasticSearchMapper.toDocument(video);
      expect(result3).toEqual(videoDocument);
    });
  });
});
