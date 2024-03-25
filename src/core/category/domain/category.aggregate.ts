import { CategoryFakeBuilder } from './category-fake.builder';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import CategoryValidatorFactory from './category-aggregate.validator';
import { AggregateRoot } from '../../shared/domain/aggregate-root';

export type CategoryConstructorProps = {
  category_id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date | null;
};

export type CategoryCreateCommand = {
  category_id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class CategoryId extends Uuid {}

export class Category extends AggregateRoot {
  category_id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: CategoryConstructorProps) {
    super();
    this.category_id = props.category_id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: CategoryCreateCommand) {
    const category = new Category(props);
    category.validate(['name']);
    return category;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeDescription(description: string | null): void {
    this.description = description;
  }

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = CategoryValidatorFactory.create();
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

  markAsNotDeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return CategoryFakeBuilder;
  }

  get entity_id() {
    return this.category_id;
  }

  toJSON() {
    return {
      category_id: this.category_id.id,
      name: this.name,
      description: this.description,
      is_active: this.is_active,
      created_at: this.created_at,
      deleted_at: this.deleted_at,
    };
  }
}
