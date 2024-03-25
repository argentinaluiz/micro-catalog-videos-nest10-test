import { Chance } from 'chance';
import { Genre, GenreId } from './genre.aggregate';
import { Category } from '../../category/domain/category.aggregate';
import { NestedCategory } from '../../category/domain/nested-category.entity';
import { NestedGenre } from './nested-genre.entity';

type PropOrFactory<T> = T | ((index: number) => T);

export enum GenreFakeMode {
  ONLY_AGGREGATE = 'ONLY_AGGREGATE',
  ONLY_NESTED = 'ONLY_NESTED',
  BOTH = 'BOTH',
}

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
  private mode: GenreFakeMode;
  private chance: Chance.Chance;

  private constructor(
    countObjs: number = 1,
    mode = GenreFakeMode.ONLY_AGGREGATE,
  ) {
    this.countObjs = countObjs;
    this.mode = mode;
    this.chance = Chance();
  }

  static aGenre() {
    return new GenreFakeBuilder<Genre>();
  }

  static aGenreAndNested() {
    return new GenreFakeBuilder<[Genre, NestedGenre]>(1, GenreFakeMode.BOTH);
  }

  static theGenres(countObjs: number) {
    return new GenreFakeBuilder<Genre[]>(countObjs);
  }

  static theGenresAndNested(countObjs: number) {
    return new GenreFakeBuilder<[Genre, NestedGenre][]>(
      countObjs,
      GenreFakeMode.BOTH,
    );
  }

  static aNestedGenre() {
    return new GenreFakeBuilder<NestedGenre>(1, GenreFakeMode.ONLY_NESTED);
  }

  static theNestedGenres(countObjs: number) {
    return new GenreFakeBuilder<NestedGenre[]>(
      countObjs,
      GenreFakeMode.ONLY_NESTED,
    );
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
      if (this.mode === GenreFakeMode.ONLY_NESTED) {
        const nestedGenre = new NestedGenre({
          genre_id: this.callFactory(this._genre_id, index),
          name: this.callFactory(this._name, index),
          is_active: this.callFactory(this._is_active, index),
          deleted_at: this.callFactory(this._deleted_at, index),
        });
        nestedGenre.validate();
        return nestedGenre;
      }

      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedCategories = this._categories.length
        ? this.callFactory(this._categories, index)
        : [nestedCategory];

      if (this.mode === GenreFakeMode.ONLY_AGGREGATE) {
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
      }

      if (this.mode === GenreFakeMode.BOTH) {
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

        const nestedGenre = new NestedGenre({
          genre_id: genre.genre_id,
          name: genre.name,
          is_active: genre.is_active,
          deleted_at: genre.deleted_at,
        });
        nestedGenre.validate();

        return [genre, nestedGenre];
      }
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
