import { Chance } from 'chance';
import { VideoFakeBuilder } from '../video-fake.builder';
import { VideoId } from '../video.aggregate';
import { Category } from '../../../category/domain/category.aggregate';
import { NestedCategory } from '../../../category/domain/nested-category.entity';
import { Rating } from '../rating.vo';
import { Genre } from '../../../genre/domain/genre.aggregate';
import { CastMember } from '../../../cast-member/domain/cast-member.aggregate';
import { NestedGenre } from '../../../genre/domain/nested-genre.entity';
import { NestedCastMember } from '../../../cast-member/domain/nested-cast-member.entity';

describe('VideoFakerBuilder Unit Tests', () => {
  describe('video_id prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();

    test('should be a function', () => {
      expect(typeof faker['_video_id']).toBe('function');
    });

    test('withVideoId', () => {
      const video_id = new VideoId();
      const $this = faker.withVideoId(video_id);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_video_id']).toBe(video_id);

      faker.withVideoId(() => video_id);
      //@ts-expect-error _video_id is a callable
      expect(faker['_video_id']()).toBe(video_id);

      expect(faker.video_id).toBe(video_id);
    });

    test('should pass index to video_id factory', () => {
      let mockFactory = jest.fn(() => new VideoId());
      faker.withVideoId(mockFactory);
      faker.build();
      expect(mockFactory).toHaveBeenCalledTimes(1);

      const videoId = new VideoId();
      mockFactory = jest.fn(() => videoId);
      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withVideoId(mockFactory);
      fakerMany.build();

      expect(mockFactory).toHaveBeenCalledTimes(2);
      expect(fakerMany.build()[0].video_id).toBe(videoId);
      expect(fakerMany.build()[1].video_id).toBe(videoId);
    });
  });

  describe('title prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_title']).toBe('function');
    });

    test('should call the word method', () => {
      const chance = Chance();
      const spyWordMethod = jest.spyOn(chance, 'word');
      faker['chance'] = chance;
      faker.build();

      expect(spyWordMethod).toHaveBeenCalled();
    });

    test('withTitle', () => {
      const $this = faker.withTitle('test title');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_title']).toBe('test title');

      faker.withTitle(() => 'test title');
      //@ts-expect-error title is callable
      expect(faker['_title']()).toBe('test title');

      expect(faker.title).toBe('test title');
    });

    test('should pass index to title factory', () => {
      faker.withTitle((index) => `test title ${index}`);
      const genre = faker.build();
      expect(genre.title).toBe(`test title 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withTitle((index) => `test title ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].title).toBe(`test title 0`);
      expect(categories[1].title).toBe(`test title 1`);
    });

    test('invalid too long case', () => {
      const $this = faker.withInvalidTitleTooLong();
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_title'].length).toBe(256);

      const tooLong = 'a'.repeat(256);
      faker.withInvalidTitleTooLong(tooLong);
      expect(faker['_title'].length).toBe(256);
      expect(faker['_title']).toBe(tooLong);
    });
  });

  describe('description prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_description']).toBe('function');
    });

    test('withDescription', () => {
      const $this = faker.withDescription('test description');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_description']).toBe('test description');

      faker.withDescription(() => 'test description');
      //@ts-expect-error description is callable
      expect(faker['_description']()).toBe('test description');

      expect(faker.description).toBe('test description');
    });

    test('should pass index to description factory', () => {
      faker.withDescription((index) => `test description ${index}`);
      const genre = faker.build();
      expect(genre.description).toBe(`test description 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withDescription((index) => `test description ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].description).toBe(`test description 0`);
      expect(categories[1].description).toBe(`test description 1`);
    });
  });

  describe('year_launched prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_year_launched']).toBe('function');
    });

    test('withYearLaunched', () => {
      const $this = faker.withYearLaunched(2021);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_year_launched']).toBe(2021);

      faker.withYearLaunched(() => 2021);
      //@ts-expect-error year_launched is callable
      expect(faker['_year_launched']()).toBe(2021);

      expect(faker.year_launched).toBe(2021);
    });

    test('should pass index to year_launched factory', () => {
      faker.withYearLaunched((index) => 2021 + index);
      const genre = faker.build();
      expect(genre.year_launched).toBe(2021);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withYearLaunched((index) => 2021 + index);
      const categories = fakerMany.build();

      expect(categories[0].year_launched).toBe(2021);
      expect(categories[1].year_launched).toBe(2022);
    });
  });

  describe('duration prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_duration']).toBe('function');
    });

    test('withDuration', () => {
      const $this = faker.withDuration(90);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_duration']).toBe(90);

      faker.withDuration(() => 90);
      //@ts-expect-error duration is callable
      expect(faker['_duration']()).toBe(90);

      expect(faker.duration).toBe(90);
    });

    test('should pass index to duration factory', () => {
      faker.withDuration((index) => 90 + index);
      const genre = faker.build();
      expect(genre.duration).toBe(90);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withDuration((index) => 90 + index);
      const categories = fakerMany.build();

      expect(categories[0].duration).toBe(90);
      expect(categories[1].duration).toBe(91);
    });
  });

  describe('rating prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_rating']).toBe('function');
    });

    test('withRating', () => {
      const $this = faker.withRating(Rating.create12());
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_rating']).toEqual(Rating.create12());

      faker.withRating(() => Rating.create10());
      //@ts-expect-error rating is callable
      expect(faker['_rating']()).toEqual(Rating.create10());

      expect(faker.rating).toEqual(Rating.create10());
    });
  });

  describe('is_opened prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_is_opened']).toBe('boolean');
    });

    test('opened', () => {
      const $this = faker.opened();
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_is_opened']).toBeTruthy();
      expect(faker.is_opened).toBeTruthy();
    });
  });

  describe('is_published prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    test('should be a function', () => {
      expect(typeof faker['_is_published']).toBe('boolean');
    });

    test('published', () => {
      const $this = faker.published();
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_is_published']).toBeTruthy();
      expect(faker.is_published).toBeTruthy();
    });
  });

  describe('banner_url prop', () => {
    test('should be a null when faker was invoked without banner_url', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      expect(faker['_banner_url']).toBeNull();
    });

    test('should be a function', () => {
      const faker = VideoFakeBuilder.aVideoWithAllMedias();
      expect(typeof faker['_banner_url']).toBe('function');
    });

    test('withBannerUrl', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      const $this = faker.withBannerUrl('test banner_url');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_banner_url']).toBe('test banner_url');

      faker.withBannerUrl(() => 'test banner_url');
      //@ts-expect-error banner_url is callable
      expect(faker['_banner_url']()).toBe('test banner_url');

      expect(faker.banner_url).toBe('test banner_url');
    });

    test('should pass index to banner_url factory', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      faker.withBannerUrl((index) => `test banner_url ${index}`);
      const genre = faker.build();
      expect(genre.banner_url).toBe(`test banner_url 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withBannerUrl((index) => `test banner_url ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].banner_url).toBe(`test banner_url 0`);
      expect(categories[1].banner_url).toBe(`test banner_url 1`);
    });
  });

  describe('thumbnail_url prop', () => {
    test('should be a null when faker was invoked without thumbnail_url', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      expect(faker['_thumbnail_url']).toBeNull();
    });

    test('should be a function', () => {
      const faker = VideoFakeBuilder.aVideoWithAllMedias();
      expect(typeof faker['_thumbnail_url']).toBe('function');
    });

    test('withThumbnailUrl', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      const $this = faker.withThumbnailUrl('test thumbnail_url');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_thumbnail_url']).toBe('test thumbnail_url');

      faker.withThumbnailUrl(() => 'test thumbnail_url');
      //@ts-expect-error thumbnail_url is callable
      expect(faker['_thumbnail_url']()).toBe('test thumbnail_url');

      expect(faker.thumbnail_url).toBe('test thumbnail_url');
    });

    test('should pass index to thumbnail_url factory', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      faker.withThumbnailUrl((index) => `test thumbnail_url ${index}`);
      const genre = faker.build();
      expect(genre.thumbnail_url).toBe(`test thumbnail_url 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withThumbnailUrl((index) => `test thumbnail_url ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].thumbnail_url).toBe(`test thumbnail_url 0`);
      expect(categories[1].thumbnail_url).toBe(`test thumbnail_url 1`);
    });
  });

  describe('thumbnail_half_url prop', () => {
    test('should be a null when faker was invoked without thumbnail_half_url', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      expect(faker['_thumbnail_half_url']).toBeNull();
    });

    test('should be a function', () => {
      const faker = VideoFakeBuilder.aVideoWithAllMedias();
      expect(typeof faker['_thumbnail_half_url']).toBe('function');
    });

    test('withThumbnailHalfUrl', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      const $this = faker.withThumbnailHalfUrl('test thumbnail_half_url');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_thumbnail_half_url']).toBe('test thumbnail_half_url');

      faker.withThumbnailHalfUrl(() => 'test thumbnail_half_url');
      //@ts-expect-error thumbnail_half_url is callable
      expect(faker['_thumbnail_half_url']()).toBe('test thumbnail_half_url');

      expect(faker.thumbnail_half_url).toBe('test thumbnail_half_url');
    });

    test('should pass index to thumbnail_half_url factory', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      faker.withThumbnailHalfUrl((index) => `test thumbnail_half_url ${index}`);
      const genre = faker.build();
      expect(genre.thumbnail_half_url).toBe(`test thumbnail_half_url 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withThumbnailHalfUrl(
        (index) => `test thumbnail_half_url ${index}`,
      );
      const categories = fakerMany.build();

      expect(categories[0].thumbnail_half_url).toBe(
        `test thumbnail_half_url 0`,
      );
      expect(categories[1].thumbnail_half_url).toBe(
        `test thumbnail_half_url 1`,
      );
    });
  });

  describe('trailer_url prop', () => {
    test('should be a function', () => {
      const faker = VideoFakeBuilder.aVideoWithAllMedias();
      expect(typeof faker['_trailer_url']).toBe('function');
    });

    test('withTrailerUrl', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      const $this = faker.withTrailerUrl('test trailer_url');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_trailer_url']).toBe('test trailer_url');

      faker.withTrailerUrl(() => 'test trailer_url');
      //@ts-expect-error trailer_url is callable
      expect(faker['_trailer_url']()).toBe('test trailer_url');

      expect(faker.trailer_url).toBe('test trailer_url');
    });

    test('should pass index to trailer_url factory', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      faker.withTrailerUrl((index) => `test trailer_url ${index}`);
      const genre = faker.build();
      expect(genre.trailer_url).toBe(`test trailer_url 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withTrailerUrl((index) => `test trailer_url ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].trailer_url).toBe(`test trailer_url 0`);
      expect(categories[1].trailer_url).toBe(`test trailer_url 1`);
    });
  });

  describe('video_url prop', () => {
    test('should be a function', () => {
      const faker = VideoFakeBuilder.aVideoWithAllMedias();
      expect(typeof faker['_video_url']).toBe('function');
    });

    test('withVideoUrl', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      const $this = faker.withVideoUrl('test video_url');
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_video_url']).toBe('test video_url');

      faker.withVideoUrl(() => 'test video_url');
      //@ts-expect-error video_url is callable
      expect(faker['_video_url']()).toBe('test video_url');

      expect(faker.video_url).toBe('test video_url');
    });

    test('should pass index to video_url factory', () => {
      const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
      faker.withVideoUrl((index) => `test video_url ${index}`);
      const genre = faker.build();
      expect(genre.video_url).toBe(`test video_url 0`);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withVideoUrl((index) => `test video_url ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].video_url).toBe(`test video_url 0`);
      expect(categories[1].video_url).toBe(`test video_url 1`);
    });
  });

  describe('categories prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    it('should be empty', () => {
      expect(faker['_categories']).toBeInstanceOf(Array);
    });

    test('addNestedCategory', () => {
      const nestedCategory = Category.fake().aNestedCategory().build();
      const $this = faker.addNestedCategory(nestedCategory);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_categories']).toStrictEqual([nestedCategory]);

      const nestedCategory2 = Category.fake().aNestedCategory().build();
      faker.addNestedCategory(() => nestedCategory2);

      expect([
        faker['_categories'][0],
        //@ts-expect-error _categories is callable
        faker['_categories'][1](),
      ]).toStrictEqual([nestedCategory, nestedCategory2]);
    });

    it('should pass index to categories factory', () => {
      const nestedCategories = [
        Category.fake().aNestedCategory().build(),
        Category.fake().aNestedCategory().build(),
      ];
      faker.addNestedCategory((index) => nestedCategories[index]);
      const genre = faker.build();

      expect(genre.categories.get(nestedCategories[0].category_id.id)).toBe(
        nestedCategories[0],
      );

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.addNestedCategory((index) => nestedCategories[index]);
      const genres = fakerMany.build();

      expect(genres[0].categories.get(nestedCategories[0].category_id.id)).toBe(
        nestedCategories[0],
      );

      expect(genres[1].categories.get(nestedCategories[1].category_id.id)).toBe(
        nestedCategories[1],
      );
    });
  });

  describe('genres prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    it('should be empty', () => {
      expect(faker['_genres']).toBeInstanceOf(Array);
    });

    test('addNestedGenre', () => {
      const nestedGenre = Genre.fake().aNestedGenre().build();
      const $this = faker.addNestedGenre(nestedGenre);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_genres']).toStrictEqual([nestedGenre]);

      const nestedGenre2 = Genre.fake().aNestedGenre().build();
      faker.addNestedGenre(() => nestedGenre2);

      expect([
        faker['_genres'][0],
        //@ts-expect-error _genres is callable
        faker['_genres'][1](),
      ]).toStrictEqual([nestedGenre, nestedGenre2]);
    });

    it('should pass index to genres factory', () => {
      const nestedGenres = [
        Genre.fake().aNestedGenre().build(),
        Genre.fake().aNestedGenre().build(),
      ];
      faker.addNestedGenre((index) => nestedGenres[index]);
      const genre = faker.build();

      expect(genre.genres.get(nestedGenres[0].genre_id.id)).toBe(
        nestedGenres[0],
      );

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.addNestedGenre((index) => nestedGenres[index]);
      const genres = fakerMany.build();

      expect(genres[0].genres.get(nestedGenres[0].genre_id.id)).toBe(
        nestedGenres[0],
      );

      expect(genres[1].genres.get(nestedGenres[1].genre_id.id)).toBe(
        nestedGenres[1],
      );
    });
  });

  describe('cast_members prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();
    it('should be empty', () => {
      expect(faker['_cast_members']).toBeInstanceOf(Array);
    });

    test('addNestedCastMember', () => {
      const nestedCastMember = CastMember.fake().aNestedActor().build();
      const $this = faker.addNestedCastMember(nestedCastMember);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_cast_members']).toStrictEqual([nestedCastMember]);

      const nestedCastMember2 = CastMember.fake().aNestedActor().build();
      faker.addNestedCastMember(() => nestedCastMember2);

      expect([
        faker['_cast_members'][0],
        //@ts-expect-error _cast_members is callable
        faker['_cast_members'][1](),
      ]).toStrictEqual([nestedCastMember, nestedCastMember2]);
    });

    it('should pass index to cast_members factory', () => {
      const nestedCastMembers = [
        CastMember.fake().aNestedActor().build(),
        CastMember.fake().aNestedActor().build(),
      ];
      faker.addNestedCastMember((index) => nestedCastMembers[index]);
      const genre = faker.build();

      expect(
        genre.cast_members.get(nestedCastMembers[0].cast_member_id.id),
      ).toBe(nestedCastMembers[0]);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.addNestedCastMember((index) => nestedCastMembers[index]);
      const castMembers = fakerMany.build();

      expect(
        castMembers[0].cast_members.get(nestedCastMembers[0].cast_member_id.id),
      ).toBe(nestedCastMembers[0]);

      expect(
        castMembers[1].cast_members.get(nestedCastMembers[1].cast_member_id.id),
      ).toBe(nestedCastMembers[1]);
    });
  });

  describe('created_at prop', () => {
    const faker = VideoFakeBuilder.aVideoWithoutImageMedias();

    test('should be a function', () => {
      expect(typeof faker['_created_at']).toBe('function');
    });

    test('withCreatedAt', () => {
      const date = new Date();
      const $this = faker.withCreatedAt(date);
      expect($this).toBeInstanceOf(VideoFakeBuilder);
      expect(faker['_created_at']).toBe(date);

      faker.withCreatedAt(() => date);
      //@ts-expect-error _created_at is a callable
      expect(faker['_created_at']()).toBe(date);
      expect(faker.created_at).toBe(date);
    });

    test('should pass index to created_at factory', () => {
      const date = new Date();
      faker.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const genre = faker.build();
      expect(genre.created_at.getTime()).toBe(date.getTime() + 2);

      const fakerMany = VideoFakeBuilder.theVideosWithoutImageMedias(2);
      fakerMany.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const categories = fakerMany.build();

      expect(categories[0].created_at.getTime()).toBe(date.getTime() + 2);
      expect(categories[1].created_at.getTime()).toBe(date.getTime() + 3);
    });
  });

  it('should create a video', () => {
    let faker = VideoFakeBuilder.aVideoWithAllMedias();
    let video = faker.build();

    expect(video.video_id).toBeInstanceOf(VideoId);
    expect(typeof video.title === 'string').toBeTruthy();
    expect(typeof video.description === 'string').toBeTruthy();
    expect(typeof video.year_launched === 'number').toBeTruthy();
    expect(typeof video.duration === 'number').toBeTruthy();
    expect(video.rating).toBeInstanceOf(Rating);
    expect(video.is_opened).toBeTruthy();
    expect(video.is_published).toBeTruthy();
    expect(video.banner_url).toBe('videos/images/banner.jpg');
    expect(video.thumbnail_url).toBe('videos/images/thumbnail.jpg');
    expect(video.thumbnail_half_url).toBe('videos/images/thumbnail_half.jpg');
    expect(video.trailer_url).toBe('videos/trailers');
    expect(video.video_url).toBe('videos/videos');
    expect(video.categories).toBeInstanceOf(Map);
    expect(video.categories.size).toBe(1);
    expect(video.categories.values().next().value).toBeInstanceOf(
      NestedCategory,
    );
    expect(video.genres).toBeInstanceOf(Map);
    expect(video.genres.size).toBe(1);
    expect(video.genres.values().next().value).toBeInstanceOf(NestedGenre);
    expect(video.cast_members).toBeInstanceOf(Map);
    expect(video.cast_members.size).toBe(1);
    expect(video.cast_members.values().next().value).toBeInstanceOf(
      NestedCastMember,
    );
    expect(video.created_at).toBeInstanceOf(Date);

    const created_at = new Date();
    const genreId = new VideoId();
    const nestedCategory1 = Category.fake().aNestedCategory().build();
    const nestedCategory2 = Category.fake().aNestedCategory().build();
    const nestedGenre1 = Genre.fake().aNestedGenre().build();
    const nestedGenre2 = Genre.fake().aNestedGenre().build();
    const nestedCastMember1 = CastMember.fake().aNestedActor().build();
    const nestedCastMember2 = CastMember.fake().aNestedActor().build();
    faker = VideoFakeBuilder.aVideoWithAllMedias();
    video = faker
      .withVideoId(genreId)
      .withTitle('name test')
      .withDescription('description test')
      .withYearLaunched(2021)
      .withDuration(90)
      .withRating(Rating.create10())
      .unopened()
      .unpublished()
      .addNestedCategory(nestedCategory1)
      .addNestedCategory(nestedCategory2)
      .addNestedGenre(nestedGenre1)
      .addNestedGenre(nestedGenre2)
      .addNestedCastMember(nestedCastMember1)
      .addNestedCastMember(nestedCastMember2)
      .withCreatedAt(created_at)
      .build();

    expect(video.video_id.id).toBe(genreId.id);
    expect(video.title).toBe('name test');
    expect(video.description).toBe('description test');
    expect(video.year_launched).toBe(2021);
    expect(video.duration).toBe(90);
    expect(video.rating).toBeValueObject(Rating.create10());
    expect(video.is_opened).toBeFalsy();
    expect(video.is_published).toBeFalsy();
    expect(video.categories.get(nestedCategory1.category_id.id)).toBe(
      nestedCategory1,
    );
    expect(video.categories.get(nestedCategory2.category_id.id)).toBe(
      nestedCategory2,
    );
    expect(video.genres.get(nestedGenre1.genre_id.id)).toBe(nestedGenre1);
    expect(video.genres.get(nestedGenre2.genre_id.id)).toBe(nestedGenre2);
    expect(video.cast_members.get(nestedCastMember1.cast_member_id.id)).toBe(
      nestedCastMember1,
    );
    expect(video.cast_members.get(nestedCastMember2.cast_member_id.id)).toBe(
      nestedCastMember2,
    );
    expect(video.created_at).toEqual(created_at);
  });

  it('should create many videos', () => {
    const faker = VideoFakeBuilder.theVideosWithoutImageMedias(2);
    const videos = faker.build();

    videos.forEach((video, index) => {
      expect(video.video_id).toBeInstanceOf(VideoId);
      expect(typeof video.title === 'string').toBeTruthy();
      expect(typeof video.description === 'string').toBeTruthy();
      expect(typeof video.year_launched === 'number').toBeTruthy();
      expect(typeof video.duration === 'number').toBeTruthy();
      expect(video.rating).toBeInstanceOf(Rating);
      expect(video.is_opened).toBeTruthy();
      expect(video.is_published).toBeTruthy();
      expect(video.banner_url).toBeNull();
      expect(video.thumbnail_url).toBeNull();
      expect(video.thumbnail_half_url).toBeNull();
      expect(video.trailer_url).toBe('videos/trailers');
      expect(video.video_url).toBe('videos/videos');
      expect(video.categories).toBeInstanceOf(Map);
      expect(video.categories.size).toBe(1);
      expect(video.categories.values().next().value).toBeInstanceOf(
        NestedCategory,
      );
      expect(video.genres).toBeInstanceOf(Map);
      expect(video.genres.size).toBe(1);
      expect(video.genres.values().next().value).toBeInstanceOf(NestedGenre);
      expect(video.cast_members).toBeInstanceOf(Map);
      expect(video.cast_members.size).toBe(1);
      expect(video.cast_members.values().next().value).toBeInstanceOf(
        NestedCastMember,
      );
      expect(video.created_at).toBeInstanceOf(Date);
    });
  });
});
