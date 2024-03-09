import { Genre } from '../../../domain/genre.aggregate';

export type GenreOutput = {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    is_active: boolean;
    deleted_at: Date | null;
  }[];
  is_active: boolean;
  created_at: Date;
};

export class GenreOutputMapper {
  static toOutput(entity: Genre): GenreOutput {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { genre_id, deleted_at, ...other_props } = entity.toJSON();
    return {
      ...other_props,
      id: genre_id,
      categories: Array.from(entity.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
    };
  }
}
