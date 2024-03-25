import { CastMember } from '../../../cast-member/domain/cast-member.aggregate';
import { Category } from '../../../category/domain/category.aggregate';
import { Genre } from '../../../genre/domain/genre.aggregate';
import { Rating } from '../rating.vo';
import { Video, VideoId } from '../video.aggregate';

function createVideo() {
  const video_id = new VideoId();
  const title = 'Title';
  const description = 'Description';
  const year_launched = 2021;
  const duration = 90;
  const rating = Rating.create10();
  const is_opened = true;
  const is_published = true;
  const banner_url = 'http://image.url';
  const thumbnail_url = 'http://image.url';
  const thumbnail_half_url = 'http://image.url';
  const trailer_url = 'http://video.url';
  const video_url = 'http://video.url';
  const nestedCategory = Category.fake().aNestedCategory().build();
  const nestedGenre = Genre.fake().aNestedGenre().build();
  const nestedCastMember = CastMember.fake().aNestedActor().build();
  const created_at = new Date();
  return new Video({
    video_id,
    title,
    description,
    year_launched,
    duration,
    rating,
    is_opened,
    is_published,
    banner_url,
    thumbnail_url,
    thumbnail_half_url,
    trailer_url,
    video_url,
    categories: new Map([[nestedCategory.category_id.id, nestedCategory]]),
    genres: new Map([[nestedGenre.genre_id.id, nestedGenre]]),
    cast_members: new Map([
      [nestedCastMember.cast_member_id.id, nestedCastMember],
    ]),
    created_at,
  });
}

describe('Video Without Validator Unit Tests', () => {
  beforeEach(() => {
    Video.prototype.validate = jest
      .fn()
      .mockImplementation(Video.prototype.validate);
  });
  test('constructor of video', () => {
    const video_id = new VideoId();
    const title = 'Title';
    const description = 'Description';
    const year_launched = 2021;
    const duration = 90;
    const rating = Rating.create10();
    const is_opened = true;
    const is_published = true;
    const banner_url = 'http://image.url';
    const thumbnail_url = 'http://image.url';
    const thumbnail_half_url = 'http://image.url';
    const trailer_url = 'http://video.url';
    const video_url = 'http://video.url';
    const nestedCategory = Category.fake().aNestedCategory().build();
    const nestedGenre = Genre.fake().aNestedGenre().build();
    const nestedCastMember = CastMember.fake().aNestedActor().build();
    const created_at = new Date();
    const video = new Video({
      video_id,
      title,
      description,
      year_launched,
      duration,
      rating,
      is_opened,
      is_published,
      banner_url,
      thumbnail_url,
      thumbnail_half_url,
      trailer_url,
      video_url,
      categories: new Map([[nestedCategory.category_id.id, nestedCategory]]),
      genres: new Map([[nestedGenre.genre_id.id, nestedGenre]]),
      cast_members: new Map([
        [nestedCastMember.cast_member_id.id, nestedCastMember],
      ]),
      created_at,
    });
    expect(video.video_id).toBe(video_id);
    expect(video.title).toBe(title);
    expect(video.description).toBe(description);
    expect(video.year_launched).toBe(year_launched);
    expect(video.duration).toBe(duration);
    expect(video.rating).toBe(rating);
    expect(video.is_opened).toBe(is_opened);
    expect(video.is_published).toBe(is_published);
    expect(video.banner_url).toBe(banner_url);
    expect(video.thumbnail_url).toBe(thumbnail_url);
    expect(video.thumbnail_half_url).toBe(thumbnail_half_url);
    expect(video.trailer_url).toBe(trailer_url);
    expect(video.video_url).toBe(video_url);
    expect(video.categories).toEqual(
      new Map([[nestedCategory.category_id.id, nestedCategory]]),
    );
    expect(video.genres).toEqual(
      new Map([[nestedGenre.genre_id.id, nestedGenre]]),
    );
    expect(video.cast_members).toEqual(
      new Map([[nestedCastMember.cast_member_id.id, nestedCastMember]]),
    );
    expect(video.created_at).toBe(created_at);
  });

  describe('create command', () => {
    test('should create a video', () => {
      const video_id = new VideoId();
      const title = 'Title';
      const description = 'Description';
      const year_launched = 2021;
      const duration = 90;
      const rating = Rating.create10();
      const is_opened = true;
      const is_published = true;
      const banner_url = 'http://image.url';
      const thumbnail_url = 'http://image.url';
      const thumbnail_half_url = 'http://image.url';
      const trailer_url = 'http://video.url';
      const video_url = 'http://video.url';
      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedGenre = Genre.fake().aNestedGenre().build();
      const nestedCastMember = CastMember.fake().aNestedActor().build();
      const created_at = new Date();
      const video = Video.create({
        video_id,
        title,
        description,
        year_launched,
        duration,
        rating,
        is_opened,
        is_published,
        banner_url,
        thumbnail_url,
        thumbnail_half_url,
        trailer_url,
        video_url,
        categories_props: [nestedCategory],
        genres_props: [nestedGenre],
        cast_members_props: [nestedCastMember],
        created_at,
      });
      expect(video.video_id).toBe(video_id);
      expect(video.title).toBe(title);
      expect(video.description).toBe(description);
      expect(video.year_launched).toBe(year_launched);
      expect(video.duration).toBe(duration);
      expect(video.rating).toBe(rating);
      expect(video.is_opened).toBe(is_opened);
      expect(video.is_published).toBe(is_published);
      expect(video.banner_url).toBe(banner_url);
      expect(video.thumbnail_url).toBe(thumbnail_url);
      expect(video.thumbnail_half_url).toBe(thumbnail_half_url);
      expect(video.trailer_url).toBe(trailer_url);
      expect(video.video_url).toBe(video_url);
      expect(video.categories).toEqual(
        new Map([[nestedCategory.category_id.id, nestedCategory]]),
      );
      expect(video.genres).toEqual(
        new Map([[nestedGenre.genre_id.id, nestedGenre]]),
      );
      expect(video.cast_members).toEqual(
        new Map([[nestedCastMember.cast_member_id.id, nestedCastMember]]),
      );
      expect(video.created_at).toBe(created_at);
      expect(Video.prototype.validate).toHaveBeenCalledTimes(1);
    });
  });

  test('should change title', () => {
    const video = createVideo();
    video.changeTitle('New Title');
    expect(video.title).toBe('New Title');
  });

  test('should change description', () => {
    const video = createVideo();
    video.changeDescription('New Description');
    expect(video.description).toBe('New Description');
  });

  test('should change year launched', () => {
    const video = createVideo();
    video.changeYearLaunched(2022);
    expect(video.year_launched).toBe(2022);
  });

  test('should change duration', () => {
    const video = createVideo();
    video.changeDuration(120);
    expect(video.duration).toBe(120);
  });

  test('should change rating', () => {
    const video = createVideo();
    video.changeRating(Rating.create14());
    expect(video.rating).toBeValueObject(Rating.create14());
  });

  test('should mark as opened', () => {
    const video = createVideo();
    video.markAsOpened();
    expect(video.is_opened).toBe(true);
  });

  test('should mark as not opened', () => {
    const video = createVideo();
    video.markAsNotOpened();
    expect(video.is_opened).toBe(false);
  });

  test('should publish', () => {
    const video = createVideo();
    video.publish();
    expect(video.is_published).toBe(true);
  });

  test('should unpublish', () => {
    const video = createVideo();
    video.unpublish();
    expect(video.is_published).toBe(false);
  });

  test('should replace banner url', () => {
    const video = createVideo();
    video.replaceBannerUrl('http://new.image.url');
    expect(video.banner_url).toBe('http://new.image.url');
  });

  test('should replace thumbnail url', () => {
    const video = createVideo();
    video.replaceThumbnailUrl('http://new.image.url');
    expect(video.thumbnail_url).toBe('http://new.image.url');
  });

  test('should replace thumbnail half url', () => {
    const video = createVideo();
    video.replaceThumbnailHalfUrl('http://new.image.url');
    expect(video.thumbnail_half_url).toBe('http://new.image.url');
  });

  test('should replace trailer url', () => {
    const video = createVideo();
    video.replaceTrailerUrl('http://new.video.url');
    expect(video.trailer_url).toBe('http://new.video.url');
  });

  test('should replace video url', () => {
    const video = createVideo();
    video.replaceVideoUrl('http://new.video.url');
    expect(video.video_url).toBe('http://new.video.url');
  });
});

describe('Video Validator', () => {
  describe('create command', () => {
    test('should an invalid video with title property', () => {
      const video = Video.fake()
        .aVideoWithoutImageMedias()
        .withInvalidTitleTooLong()
        .build();
      expect(video.notification.hasErrors()).toBe(true);
      expect(video.notification).notificationContainsErrorMessages([
        {
          title: ['title must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
  describe('changeTitle method', () => {
    it('should a invalid video using title property', () => {
      const video = Video.fake().aVideoWithoutImageMedias().build();
      video.changeTitle('t'.repeat(256));
      expect(video.notification.hasErrors()).toBe(true);
      expect(video.notification).notificationContainsErrorMessages([
        {
          title: ['title must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
