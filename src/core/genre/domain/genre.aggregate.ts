import { GenreFakeBuilder } from './genre-fake.builder';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import GenreValidatorFactory from './genre.validator';
import { AggregateRoot } from '../../shared/domain/aggregate-root';
import {
  NestedCategory,
  NestedCategoryConstructorProps,
} from '../../category/domain/nested-category.entity';
import { CategoryId } from '../../category/domain/category.aggregate';

export type GenreConstructorProps = {
  genre_id: GenreId;
  name: string;
  categories: Map<string, NestedCategory>;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date | null;
};

export type GenreCreateCommand = {
  genre_id: GenreId;
  name: string;
  categories_props: NestedCategoryConstructorProps[];
  is_active: boolean;
  created_at: Date;
};

export class GenreId extends Uuid {}

export class Genre extends AggregateRoot {
  genre_id: GenreId;
  name: string;
  categories: Map<string, NestedCategory>;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: GenreConstructorProps) {
    super();
    this.genre_id = props.genre_id;
    this.name = props.name;
    this.categories = props.categories;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: GenreCreateCommand) {
    const genre = new Genre({
      ...props,
      categories: new Map(
        props.categories_props.map((category_props) => [
          category_props.category_id.id,
          NestedCategory.create(category_props),
        ]),
      ),
    });
    genre.validate(['name']);
    return genre;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
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

  changeNestedCategoryName(categoryId: CategoryId, name: string) {
    const nestedCategory = this.categories.get(categoryId.id);

    if (!nestedCategory) {
      throw new Error('Nested Category not found');
    }

    nestedCategory.changeName(name);
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

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = GenreValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
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

  markAsUndeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return GenreFakeBuilder;
  }

  get entity_id() {
    return this.genre_id;
  }

  toJSON() {
    return {
      genre_id: this.genre_id.id,
      name: this.name,
      categories: Array.from(this.categories.values()).map((category) =>
        category.toJSON(),
      ),
      is_active: this.is_active,
      created_at: this.created_at,
      deleted_at: this.deleted_at,
    };
  }
}
