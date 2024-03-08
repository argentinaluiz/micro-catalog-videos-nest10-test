import { Entity } from '../../shared/domain/entity';
import { CategoryId } from './category.aggregate';
import NestedCategoryValidatorFactory from './nested-category.validator';

export type NestedCategoryConstructorProps = {
  category_id: CategoryId;
  name: string;
  is_active: boolean;
  deleted_at?: Date | null;
};

export type NestedCategoryCreateCommand = {
  category_id: CategoryId;
  name: string;
  is_active: boolean;
};

export class NestedCategory extends Entity {
  category_id: CategoryId;
  name: string;
  is_active: boolean = true;
  deleted_at: Date | null = null;

  constructor(props: NestedCategoryConstructorProps) {
    super();
    this.category_id = props.category_id;
    this.name = props.name;
    this.is_active = props.is_active;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: NestedCategoryCreateCommand) {
    const nestedCategory = new NestedCategory(props);
    nestedCategory.validate(['name']);
    return nestedCategory;
  }

  get entity_id() {
    return this.category_id;
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
    const validator = NestedCategoryValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  toJSON() {
    return {
      category_id: this.category_id.id,
      name: this.name,
      is_active: this.is_active,
      deleted_at: this.deleted_at,
    };
  }
}
