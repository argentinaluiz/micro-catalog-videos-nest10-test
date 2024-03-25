import { VideoFakeBuilder } from './video-fake.builder';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import VideoValidatorFactory from './video.validator';
import { AggregateRoot } from '../../shared/domain/aggregate-root';
import {
  NestedCategory,
  NestedCategoryConstructorProps,
} from '../../category/domain/nested-category.entity';
import { CategoryId } from '../../category/domain/category.aggregate';
import { Rating } from './rating.vo';
import {
  NestedGenre,
  NestedGenreConstructorProps,
} from '../../genre/domain/nested-genre.entity';
import {
  NestedCastMember,
  NestedCastMemberConstructorProps,
} from '../../cast-member/domain/nested-cast-member.entity';

export type VideoConstructorProps = {
  video_id: VideoId;
  title: string;
  description: string;
  year_launched: number;
  duration: number;
  rating: Rating;
  is_opened: boolean;
  is_published: boolean;

  banner_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_half_url?: string | null;
  trailer_url: string;
  video_url: string;

  categories: Map<string, NestedCategory>;
  genres: Map<string, NestedGenre>;
  cast_members: Map<string, NestedCastMember>;
  created_at: Date;
  deleted_at?: Date | null;
};

export type VideoCreateCommand = {
  video_id: VideoId;
  title: string;
  description: string;
  year_launched: number;
  duration: number;
  rating: Rating;
  is_opened: boolean;
  is_published: boolean;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_half_url?: string | null;
  trailer_url: string;
  video_url: string;
  categories_props: NestedCategoryConstructorProps[];
  genres_props: NestedGenreConstructorProps[];
  cast_members_props: NestedCastMemberConstructorProps[];
  created_at: Date;
};

export class VideoId extends Uuid {}

export class Video extends AggregateRoot {
  video_id: VideoId;
  title: string;
  description: string;
  year_launched: number;
  duration: number;
  rating: Rating;
  is_opened: boolean;
  is_published: boolean;
  banner_url: string | null;
  thumbnail_url: string | null;
  thumbnail_half_url: string | null;
  trailer_url: string;
  video_url: string;
  categories: Map<string, NestedCategory>;
  genres: Map<string, NestedGenre>;
  cast_members: Map<string, NestedCastMember>;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: VideoConstructorProps) {
    super();
    this.video_id = props.video_id;
    this.title = props.title;
    this.description = props.description;
    this.year_launched = props.year_launched;
    this.duration = props.duration;
    this.rating = props.rating;
    this.is_opened = props.is_opened;
    this.is_published = props.is_published;
    this.banner_url = props.banner_url ?? null;
    this.thumbnail_url = props.thumbnail_url ?? null;
    this.thumbnail_half_url = props.thumbnail_half_url ?? null;
    this.trailer_url = props.trailer_url;
    this.video_url = props.video_url;
    this.categories = props.categories;
    this.genres = props.genres;
    this.cast_members = props.cast_members;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: VideoCreateCommand) {
    const genre = new Video({
      ...props,
      categories: new Map(
        props.categories_props.map((category_props) => [
          category_props.category_id.id,
          NestedCategory.create(category_props),
        ]),
      ),
      genres: new Map(
        props.genres_props.map((genre_props) => [
          genre_props.genre_id.id,
          NestedGenre.create(genre_props),
        ]),
      ),
      cast_members: new Map(
        props.cast_members_props.map((cast_member_props) => [
          cast_member_props.cast_member_id.id,
          NestedCastMember.create(cast_member_props),
        ]),
      ),
    });
    genre.validate(['title']);
    return genre;
  }

  changeTitle(title: string): void {
    this.title = title;
    this.validate(['title']);
  }

  changeDescription(description: string): void {
    this.description = description;
  }

  changeYearLaunched(year_launched: number): void {
    this.year_launched = year_launched;
  }

  changeDuration(duration: number): void {
    this.duration = duration;
  }

  changeRating(rating: Rating): void {
    this.rating = rating;
  }

  markAsOpened(): void {
    this.is_opened = true;
  }

  markAsNotOpened(): void {
    this.is_opened = false;
  }

  publish() {
    this.is_published = true;
  }

  unpublish() {
    this.is_published = false;
  }

  replaceBannerUrl(banner_url: string): void {
    this.banner_url = banner_url;
  }

  replaceThumbnailUrl(thumbnail_url: string): void {
    this.thumbnail_url = thumbnail_url;
  }

  replaceThumbnailHalfUrl(thumbnail_half_url: string): void {
    this.thumbnail_half_url = thumbnail_half_url;
  }

  replaceTrailerUrl(trailer_url: string): void {
    this.trailer_url = trailer_url;
  }

  replaceVideoUrl(video_url: string): void {
    this.video_url = video_url;
  }

  addNestedCategory(categoryProps: NestedCategoryConstructorProps) {
    const nestedCategory = NestedCategory.create(categoryProps);
    this.categories.set(nestedCategory.category_id.id, nestedCategory);
  }

  removeCategory(categoryId: CategoryId) {
    const nestedCategory = this.categories.get(categoryId.id);

    if (!nestedCategory) {
      throw new Error('Nested Category not found');
    }

    nestedCategory.markAsDeleted();
  }

  activateNestedCategory(categoryId: CategoryId) {
    const nestedCategory = this.categories.get(categoryId.id);

    if (!nestedCategory) {
      throw new Error('Nested Category not found');
    }

    nestedCategory.activate();
  }

  deactivateNestedCategory(categoryId: CategoryId) {
    const nestedCategory = this.categories.get(categoryId.id);

    if (!nestedCategory) {
      throw new Error('Nested Category not found');
    }

    nestedCategory.deactivate();
  }

  changeNestedCategoryName(categoryId: CategoryId, title: string) {
    const nestedCategory = this.categories.get(categoryId.id);

    if (!nestedCategory) {
      throw new Error('Nested Category not found');
    }

    nestedCategory.changeName(title);
  }

  syncNestedCategories(categoriesProps: NestedCategoryConstructorProps[]) {
    if (!categoriesProps.length) {
      throw new Error('Categories id is empty');
    }

    this.categories = new Map(
      categoriesProps.map((categoryProps) => [
        categoryProps.category_id.id,
        NestedCategory.create(categoryProps),
      ]),
    );
  }

  syncNestedGenres(genresProps: NestedGenreConstructorProps[]) {
    if (!genresProps.length) {
      throw new Error('Genres id is empty');
    }

    this.genres = new Map(
      genresProps.map((genreProps) => [
        genreProps.genre_id.id,
        NestedGenre.create(genreProps),
      ]),
    );
  }

  syncNestedCastMembers(castMembersProps: NestedCastMemberConstructorProps[]) {
    if (!castMembersProps.length) {
      throw new Error('Cast Members id is empty');
    }

    this.cast_members = new Map(
      castMembersProps.map((castMemberProps) => [
        castMemberProps.cast_member_id.id,
        NestedCastMember.create(castMemberProps),
      ]),
    );
  }

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = VideoValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsUndeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return VideoFakeBuilder;
  }

  get entity_id() {
    return this.video_id;
  }

  toJSON() {
    return {
      video_id: this.video_id.id,
      title: this.title,
      description: this.description,
      year_launched: this.year_launched,
      duration: this.duration,
      rating: this.rating.value,
      is_opened: this.is_opened,
      is_published: this.is_published,
      banner: this.banner_url ? this.banner_url : null,
      thumbnail: this.thumbnail_url ? this.thumbnail_url : null,
      thumbnail_half: this.thumbnail_half_url ? this.thumbnail_half_url : null,
      trailer: this.trailer_url,
      video: this.video_url,
      categories: Array.from(this.categories.values()).map((category) =>
        category.toJSON(),
      ),
      genres: Array.from(this.genres.values()).map((genre) => genre.toJSON()),
      cast_members: Array.from(this.cast_members.values()).map((cast_member) =>
        cast_member.toJSON(),
      ),
      created_at: this.created_at,
    };
  }
}
