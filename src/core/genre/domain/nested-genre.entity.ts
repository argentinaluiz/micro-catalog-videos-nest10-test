import { Entity } from '../../shared/domain/entity';
import { GenreId } from './genre.aggregate';
import NestedGenreValidatorFactory from './nested-genre.validator';

export type NestedGenreConstructorProps = {
  genre_id: GenreId;
  name: string;
  is_active: boolean;
  deleted_at?: Date | null;
};

export type NestedGenreCreateCommand = {
  genre_id: GenreId;
  name: string;
  is_active: boolean;
};

export class NestedGenre extends Entity {
  genre_id: GenreId;
  name: string;
  is_active: boolean = true;
  deleted_at: Date | null = null;

  constructor(props: NestedGenreConstructorProps) {
    super();
    this.genre_id = props.genre_id;
    this.name = props.name;
    this.is_active = props.is_active;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: NestedGenreCreateCommand) {
    const nestedGenre = new NestedGenre(props);
    nestedGenre.validate(['name']);
    return nestedGenre;
  }

  get entity_id() {
    return this.genre_id;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  activate() {
    this.is_active = true;
  }

  deactivate() {
    this.is_active = false;
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsNotDeleted() {
    this.deleted_at = null;
  }

  validate(fields?: string[]) {
    const validator = NestedGenreValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  toJSON() {
    return {
      genre_id: this.genre_id.id,
      name: this.name,
      is_active: this.is_active,
      deleted_at: this.deleted_at,
    };
  }
}
