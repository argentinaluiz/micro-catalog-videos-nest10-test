import { IUseCase } from '../../../../shared/application/use-case-interface';
import { IGenreRepository } from '../../../domain/genre.repository';
import { Genre, GenreId } from '../../../domain/genre.aggregate';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { SaveGenreInput } from './save-genre.input';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { ICategoryRepository } from '../../../../category/domain/category.repository';
import {
  Category,
  CategoryId,
} from '../../../../category/domain/category.aggregate';
import { NestedCategoryConstructorProps } from '../../../../category/domain/nested-category.entity';

export class SaveGenreUseCase
  implements IUseCase<SaveGenreInput, SaveGenreOutput>
{
  constructor(
    private genreRepo: IGenreRepository,
    private categoryRepo: ICategoryRepository,
  ) {}

  async execute(input: SaveGenreInput): Promise<SaveGenreOutput> {
    const genreId = new GenreId(input.genre_id);
    const genre = await this.genreRepo.findById(genreId);

    return genre ? this.updateGenre(input, genre) : this.createGenre(input);
  }

  private async createGenre(input: SaveGenreInput) {
    const nestedCategoriesProps = await this.getCategoriesProps(
      input.categories_id,
    );

    const entity = Genre.create({
      genre_id: new GenreId(input.genre_id),
      name: input.name,
      categories_props: nestedCategoriesProps,
      is_active: input.is_active,
      created_at: input.created_at,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.genreRepo.insert(entity);
    return { id: entity.genre_id.id, created: true };
  }

  private async updateGenre(input: SaveGenreInput, genre: Genre) {
    if (!genre) {
      throw new NotFoundError(input.genre_id, Genre);
    }

    genre.changeName(input.name);
    const nestedCategoriesProps = await this.getCategoriesProps(
      input.categories_id,
    );
    genre.syncNestedCategories(nestedCategoriesProps);

    input.is_active === true ? genre.activate() : genre.deactivate();

    genre.changeCreatedAt(input.created_at);

    if (genre.notification.hasErrors()) {
      throw new EntityValidationError(genre.notification.toJSON());
    }

    await this.genreRepo.update(genre);

    return { id: genre.genre_id.id, created: false };
  }

  private async getCategoriesProps(
    categoriesIds: string[],
  ): Promise<NestedCategoryConstructorProps[]> {
    const { exists: categoriesExists, not_exists: notCategoriesExists } =
      await this.categoryRepo.findByIds(
        categoriesIds.map((c) => new CategoryId(c)),
      );

    if (notCategoriesExists.length > 0) {
      throw new EntityValidationError([
        {
          categories_id: notCategoriesExists.map(
            (c) => new NotFoundError(c.id, Category).message,
          ),
        },
      ]);
    }

    return categoriesExists.map((c) => ({
      category_id: c.category_id,
      name: c.name,
      is_active: c.is_active,
      created_at: c.created_at,
    }));
  }
}

export type SaveGenreOutput = { id: string; created: boolean };
