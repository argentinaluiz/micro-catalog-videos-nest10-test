import { Chance } from 'chance';
import { Genre, GenreId } from './genre.aggregate';
import { Category } from '../../category/domain/category.aggregate';
import { NestedCategory } from '../../category/domain/nested-category.entity';

type PropOrFactory<T> = T | ((index: number) => T);

export class GenreFakeBuilder<TBuild = any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _genre_id: PropOrFactory<GenreId> = (_index) => new GenreId();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _name: PropOrFactory<string> = (_index) => this.chance.word();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _categories: PropOrFactory<NestedCategory>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _created_at: PropOrFactory<Date> = (_index) => new Date();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private chance: Chance.Chance;

  static aGenre() {
    return new GenreFakeBuilder<Genre>();
  }

  static theGenres(countObjs: number) {
    return new GenreFakeBuilder<Genre[]>(countObjs);
  }


  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withGenreId(valueOrFactory: PropOrFactory<GenreId>) {
    this._genre_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  addNestedCategory(valueOrFactory: PropOrFactory<NestedCategory>) {
    this._categories.push(valueOrFactory);
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

  withInvalidNameTooLong(value?: string) {
    this._name = value ?? this.chance.word({ length: 256 });
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
    const genres = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const nestedCategory = Category.fake().aCategoryAndNested().build()[1];
      const nestedCategories = this._categories.length
        ? this.callFactory(this._categories, index)
        : [nestedCategory];

      const genre = new Genre({
        genre_id: this.callFactory(this._genre_id, index),
        name: this.callFactory(this._name, index),
        categories: new Map(
          nestedCategories.map((nested) => [nested.category_id.id, nested]),
        ),
        is_active: this.callFactory(this._is_active, index),
        created_at: this.callFactory(this._created_at, index),
        deleted_at: this.callFactory(this._deleted_at, index),
      });
      genre.validate();
      return genre;
    });
    return this.countObjs === 1 ? (genres[0] as any) : genres;
  }

  get genre_id() {
    return this.getValue('genre_id');
  }

  get name() {
    return this.getValue('name');
  }

  get categories(): NestedCategory[] {
    let nestedCategories = this.getValue('categories');

    if (!nestedCategories.length) {
      nestedCategories = [Category.fake().aCategoryAndNested().build()[1]];
    }
    return nestedCategories;
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get created_at() {
    return this.getValue('created_at');
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
