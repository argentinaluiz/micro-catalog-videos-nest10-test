import { Chance } from 'chance';
import { Video, VideoId } from './video.aggregate';
import { Rating } from './rating.vo';
import { NestedCategory } from '../../category/domain/nested-category.entity';
import { NestedGenre } from '../../genre/domain/nested-genre.entity';
import { NestedCastMember } from '../../cast-member/domain/nested-cast-member.entity';
import { Category } from '../../category/domain/category.aggregate';
import { Genre } from '../../genre/domain/genre.aggregate';
import { CastMember } from '../../cast-member/domain/cast-member.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class VideoFakeBuilder<TBuild = any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _video_id: PropOrFactory<VideoId> = (_index) => new VideoId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _title: PropOrFactory<string> = (_index) => this.chance.word();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _description: PropOrFactory<string> = (_index) => this.chance.word();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _year_launched: PropOrFactory<number> = (_index) =>
    +this.chance.year();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _duration: PropOrFactory<number> = (_index) =>
    this.chance.integer({ min: 1, max: 100 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _rating: PropOrFactory<Rating> = (_index) => Rating.createRL();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _is_opened: PropOrFactory<boolean> = true;
  private _is_published: PropOrFactory<boolean> = true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _banner_url: PropOrFactory<string | null> | undefined = (_index) =>
    'videos/images/banner.jpg';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _thumbnail_url: PropOrFactory<string | null> | undefined = (_index) =>
    'videos/images/thumbnail.jpg';
  private _thumbnail_half_url: PropOrFactory<string | null> | undefined = (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _index,
  ) => 'videos/images/thumbnail_half.jpg';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _trailer_url: PropOrFactory<string | null> | undefined = (_index) =>
    'videos/trailers';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _video_url: PropOrFactory<string | null> | undefined = (_index) =>
    'videos/videos';

  private _categories: PropOrFactory<NestedCategory>[] = [];
  private _genres: PropOrFactory<NestedGenre>[] = [];
  private _cast_members: PropOrFactory<NestedCastMember>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _created_at: PropOrFactory<Date> = (_index) => new Date();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private chance: Chance.Chance;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  static aVideoWithoutImageMedias() {
    return new VideoFakeBuilder<Video>()
      .withoutBannerUrl()
      .withoutThumbnailUrl()
      .withoutThumbnailHalfUrl();
  }

  static aVideoWithAllMedias() {
    return new VideoFakeBuilder<Video>();
  }

  static theVideosWithoutImageMedias(countObjs: number) {
    return new VideoFakeBuilder<Video[]>(countObjs)
      .withoutBannerUrl()
      .withoutThumbnailUrl()
      .withoutThumbnailHalfUrl();
  }

  static theVideosWithAllMedias(countObjs: number) {
    return new VideoFakeBuilder<Video[]>(countObjs);
  }

  withVideoId(valueOrFactory: PropOrFactory<VideoId>) {
    this._video_id = valueOrFactory;
    return this;
  }

  withTitle(valueOrFactory: PropOrFactory<string>) {
    this._title = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string>) {
    this._description = valueOrFactory;
    return this;
  }

  withYearLaunched(valueOrFactory: PropOrFactory<number>) {
    this._year_launched = valueOrFactory;
    return this;
  }

  withDuration(valueOrFactory: PropOrFactory<number>) {
    this._duration = valueOrFactory;
    return this;
  }

  withRating(valueOrFactory: PropOrFactory<Rating>) {
    this._rating = valueOrFactory;
    return this;
  }

  opened() {
    this._is_opened = true;
    return this;
  }

  unopened() {
    this._is_opened = false;
    return this;
  }

  published() {
    this._is_published = true;
    return this;
  }

  unpublished() {
    this._is_published = false;
    return this;
  }

  withBannerUrl(valueOrFactory: PropOrFactory<string | null>) {
    this._banner_url = valueOrFactory;
    return this;
  }

  withoutBannerUrl() {
    this._banner_url = null;
    return this;
  }

  withThumbnailUrl(valueOrFactory: PropOrFactory<string | null>) {
    this._thumbnail_url = valueOrFactory;
    return this;
  }

  withoutThumbnailUrl() {
    this._thumbnail_url = null;
    return this;
  }

  withThumbnailHalfUrl(valueOrFactory: PropOrFactory<string | null>) {
    this._thumbnail_half_url = valueOrFactory;
    return this;
  }

  withoutThumbnailHalfUrl() {
    this._thumbnail_half_url = null;
    return this;
  }

  withTrailerUrl(valueOrFactory: PropOrFactory<string | null>) {
    this._trailer_url = valueOrFactory;
    return this;
  }

  withVideoUrl(valueOrFactory: PropOrFactory<string | null>) {
    this._video_url = valueOrFactory;
    return this;
  }

  addNestedCategory(valueOrFactory: PropOrFactory<NestedCategory>) {
    this._categories.push(valueOrFactory);
    return this;
  }

  addNestedGenre(valueOrFactory: PropOrFactory<NestedGenre>) {
    this._genres.push(valueOrFactory);
    return this;
  }

  addNestedCastMember(valueOrFactory: PropOrFactory<NestedCastMember>) {
    this._cast_members.push(valueOrFactory);
    return this;
  }

  withInvalidTitleTooLong(value?: string) {
    this._title = value ?? this.chance.word({ length: 256 });
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  deleted() {
    this._deleted_at = new Date();
    return this;
  }

  undeleted() {
    this._deleted_at = null;
    return this;
  }

  build(): TBuild {
    const videos = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedCategories = this._categories.length
        ? this.callFactory(this._categories, index)
        : [nestedCategory];

      const nestedCastMember = CastMember.fake().aNestedActor().build();
      const nestedCastMembers = this._cast_members.length
        ? this.callFactory(this._cast_members, index)
        : [nestedCastMember];

      const nestedGenre = Genre.fake().aNestedGenre().build();
      const nestedGenres = this._genres.length
        ? this.callFactory(this._genres, index)
        : [nestedGenre];

      const video = new Video({
        video_id: this.callFactory(this._video_id, index),
        title: this.callFactory(this._title, index),
        description: this.callFactory(this._description, index),
        year_launched: this.callFactory(this._year_launched, index),
        duration: this.callFactory(this._duration, index),
        rating: this.callFactory(this._rating, index),
        is_opened: this.callFactory(this._is_opened, index),
        is_published: this.callFactory(this._is_published, index),
        banner_url: this.callFactory(this._banner_url, index),
        thumbnail_url: this.callFactory(this._thumbnail_url, index),
        thumbnail_half_url: this.callFactory(this._thumbnail_half_url, index),
        trailer_url: this.callFactory(this._trailer_url, index),
        video_url: this.callFactory(this._video_url, index),
        categories: new Map(
          nestedCategories.map((nested) => [nested.category_id.id, nested]),
        ),
        cast_members: new Map(
          nestedCastMembers.map((nested) => [nested.cast_member_id.id, nested]),
        ),
        genres: new Map(
          nestedGenres.map((nested) => [nested.genre_id.id, nested]),
        ),
        created_at: this.callFactory(this._created_at, index),
        deleted_at: this.callFactory(this._deleted_at, index),
      });
      video.validate();
      return video;
    });
    return this.countObjs === 1 ? (videos[0] as any) : videos;
  }

  get video_id() {
    return this.getValue('video_id');
  }

  get title() {
    return this.getValue('title');
  }

  get description() {
    return this.getValue('description');
  }

  get year_launched() {
    return this.getValue('year_launched');
  }

  get duration() {
    return this.getValue('duration');
  }

  get rating() {
    return this.getValue('rating');
  }

  get is_opened() {
    return this.getValue('is_opened');
  }

  get is_published() {
    return this.getValue('is_published');
  }

  get banner_url() {
    const banner_url = this.getValue('banner_url');
    return banner_url ?? 'videos/images/banner.jpg';
  }

  get thumbnail_url() {
    const thumbnail_url = this.getValue('thumbnail_url');
    return thumbnail_url ?? 'videos/images/thumbnail.jpg';
  }

  get thumbnail_half_url() {
    const thumbnail_half_url = this.getValue('thumbnail_half_url');
    return thumbnail_half_url ?? 'videos/images/thumbnail_half.jpg';
  }

  get trailer_url() {
    const trailer_url = this.getValue('trailer_url');
    return trailer_url ?? 'videos/images/trailer';
  }

  get video_url() {
    const video = this.getValue('video_url');
    return video ?? 'videos/images/video';
  }

  get categories(): NestedCategory[] {
    let nestedCategories = this.getValue('categories');

    if (!nestedCategories.length) {
      nestedCategories = [Category.fake().aNestedCategory().build()];
    }
    return nestedCategories;
  }

  get genres(): NestedGenre[] {
    let nestedGenres = this.getValue('genres');

    if (!nestedGenres.length) {
      nestedGenres = [Genre.fake().aNestedGenre().build()];
    }
    return nestedGenres;
  }

  get cast_members(): NestedCastMember[] {
    let nestedCastMembers = this.getValue('cast_members');

    if (!nestedCastMembers.length) {
      nestedCastMembers = [CastMember.fake().aNestedActor().build()];
    }

    return nestedCastMembers;
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get deleted_at() {
    return this.getValue('deleted_at');
  }

  private getValue(prop: any) {
    const privateProp = `_${prop}` as keyof this;
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    if (typeof factoryOrValue === 'function') {
      return factoryOrValue(index);
    }

    if (factoryOrValue instanceof Array) {
      return factoryOrValue.map((value) => this.callFactory(value, index));
    }

    return factoryOrValue;
  }
}
