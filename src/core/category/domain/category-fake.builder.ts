import { Chance } from 'chance';
import { Category, CategoryId } from './category.aggregate';
import { NestedCategory } from './nested-category.entity';

type PropOrFactory<T> = T | ((index: number) => T);

export enum CategoryFakeMode {
  ONLY_AGGREGATE = 'ONLY_AGGREGATE',
  ONLY_NESTED = 'ONLY_NESTED',
  BOTH = 'BOTH',
}

export class CategoryFakeBuilder<TBuild = any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _category_id: PropOrFactory<CategoryId> = (_index) =>
    new CategoryId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _name: PropOrFactory<string> = (_index) => this.chance.word();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _description: PropOrFactory<string | null> = (_index) =>
    this.chance.paragraph();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _created_at: PropOrFactory<Date> = (_index) => new Date();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private mode: CategoryFakeMode;

  static aCategory() {
    return new CategoryFakeBuilder<Category>();
  }

  static aCategoryAndNested() {
    return new CategoryFakeBuilder<[Category, NestedCategory]>(
      1,
      CategoryFakeMode.BOTH,
    );
  }

  static theCategories(countObjs: number) {
    return new CategoryFakeBuilder<Category[]>(countObjs);
  }

  static theCategoriesAndNested(countObjs: number) {
    return new CategoryFakeBuilder<[Category, NestedCategory][]>(
      countObjs,
      CategoryFakeMode.BOTH,
    );
  }

  static aNestedCategory() {
    return new CategoryFakeBuilder<NestedCategory>(
      1,
      CategoryFakeMode.ONLY_NESTED,
    );
  }

  static theNestedCategories(countObjs: number) {
    return new CategoryFakeBuilder<NestedCategory[]>(
      countObjs,
      CategoryFakeMode.ONLY_NESTED,
    );
  }

  private chance: Chance.Chance;

  private constructor(
    countObjs: number = 1,
    howNestedManage = CategoryFakeMode.ONLY_AGGREGATE,
  ) {
    this.countObjs = countObjs;
    this.mode = howNestedManage;
    this.chance = Chance();
  }

  withCategoryId(valueOrFactory: PropOrFactory<CategoryId>) {
    this._category_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string | null>) {
    this._description = valueOrFactory;
    return this;
  }

  activate() {
    this._is_active = true;
    return this;
  }

  deactivate() {
    this._is_active = false;
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

  withInvalidNameTooLong(value?: string) {
    this._name = value ?? this.chance.word({ length: 256 });
    return this;
  }

  build(): TBuild {
    const categories = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        if (this.mode === CategoryFakeMode.ONLY_NESTED) {
          const nested = new NestedCategory({
            category_id: this.callFactory(this._category_id, index),
            name: this.callFactory(this._name, index),
            is_active: this.callFactory(this._is_active, index),
            deleted_at: this.callFactory(this._deleted_at, index),
          });
          nested.validate();
          return nested;
        }

        if (this.mode === CategoryFakeMode.ONLY_AGGREGATE) {
          const category = new Category({
            category_id: this.callFactory(this._category_id, index),
            name: this.callFactory(this._name, index),
            description: this.callFactory(this._description, index),
            is_active: this.callFactory(this._is_active, index),
            created_at: this.callFactory(this._created_at, index),
            deleted_at: this.callFactory(this._deleted_at, index),
          });
          category.validate();
          return category;
        }

        if (this.mode === CategoryFakeMode.BOTH) {
          const category = new Category({
            category_id: this.callFactory(this._category_id, index),
            name: this.callFactory(this._name, index),
            description: this.callFactory(this._description, index),
            is_active: this.callFactory(this._is_active, index),
            created_at: this.callFactory(this._created_at, index),
            deleted_at: this.callFactory(this._deleted_at, index),
          });
          category.validate();
          const nested = new NestedCategory({
            category_id: category.category_id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: category.deleted_at,
          });

          return [category, nested];
        }
      });
    return this.countObjs === 1 ? (categories[0] as any) : categories;
  }

  get category_id() {
    return this.getValue('category_id');
  }

  get name() {
    return this.getValue('name');
  }

  get description() {
    return this.getValue('description');
  }

  get is_active() {
    return this.getValue('is_active');
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
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }
}
