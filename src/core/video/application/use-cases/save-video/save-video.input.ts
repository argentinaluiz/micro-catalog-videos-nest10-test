import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  validateSync,
} from 'class-validator';
import { RatingValues } from '../../../domain/rating.vo';

export type SaveVideoInputConstructorProps = {
  video_id: string;
  title: string;
  description: string;
  year_launched: number;
  duration: number;
  rating: RatingValues;
  is_opened: boolean;
  is_published: boolean;
  banner_url: string;
  thumbnail_url: string;
  thumbnail_half_url: string;
  trailer_url: string;
  video_url: string;
  categories_id: string[];
  genres_id: string[];
  cast_members_id: string[];
  created_at: Date;
};

export class SaveVideoInput {
  @IsUUID('4')
  @IsString()
  @IsNotEmpty()
  video_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsNotEmpty()
  year_launched: number;

  @IsInt()
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsNotEmpty()
  rating: RatingValues;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const allowList = ['true', true, 1, '1', 'false', false, 0, '0'];
    if (allowList.includes(value)) {
      return value === 'true' || value === true || value === 1 || value === '1';
    }

    return !value ? null : value;
  })
  is_opened: boolean;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    const allowList = ['true', true, 1, '1', 'false', false, 0, '0'];
    if (allowList.includes(value)) {
      return value === 'true' || value === true || value === 1 || value === '1';
    }

    return !value ? null : value;
  })
  is_published: boolean;

  @IsString()
  @IsNotEmpty()
  banner_url: string;

  @IsString()
  @IsNotEmpty()
  thumbnail_url: string;

  @IsString()
  @IsNotEmpty()
  thumbnail_half_url: string;

  @IsString()
  @IsNotEmpty()
  trailer_url: string;

  @IsString()
  @IsNotEmpty()
  video_url: string;

  @IsUUID('4', { each: true })
  @IsArray()
  @IsNotEmpty()
  categories_id: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  @IsNotEmpty()
  genres_id: string[];

  @IsUUID('4', { each: true })
  @IsArray()
  @IsNotEmpty()
  cast_members_id: string[];

  @IsDate({
    message: 'created_at must be a Date instance or a valid date string',
  })
  @IsNotEmpty()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  created_at: Date;

  constructor(props?: SaveVideoInputConstructorProps) {
    if (!props) return;
    this.video_id = props.video_id;
    this.title = props.title;
    this.description = props.description;
    this.year_launched = props.year_launched;
    this.duration = props.duration;
    this.rating = props.rating;
    this.is_opened = props.is_opened;
    this.is_published = props.is_published;
    this.banner_url = props.banner_url;
    this.thumbnail_url = props.thumbnail_url;
    this.thumbnail_half_url = props.thumbnail_half_url;
    this.trailer_url = props.trailer_url;
    this.video_url = props.video_url;
    this.categories_id = props.categories_id;
    this.genres_id = props.genres_id;
    this.cast_members_id = props.cast_members_id;
    this.created_at = props.created_at;
  }
}

export class ValidateSaveVideoInput {
  static validate(input: SaveVideoInput) {
    return validateSync(input);
  }
}
