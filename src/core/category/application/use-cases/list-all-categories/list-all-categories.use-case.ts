import {
  CategoryOutput,
  CategoryOutputMapper,
} from '../common/category-output';
import { IUseCase } from '../../../../shared/application/use-case-interface';
import { SearchInput } from '../../../../shared/application/search-input';
import { ICategoryRepository } from '../../../domain/category.repository';

export class ListAllCategoriesUseCase
  implements IUseCase<ListCategoriesInput, ListCategoriesOutput>
{
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(): Promise<ListCategoriesOutput> {
    const categories = await this.categoryRepo.ignoreSoftDeleted().findBy(
      {
        is_active: true,
      },
      { field: 'name', direction: 'asc' },
    );
    return categories.map(CategoryOutputMapper.toOutput);
  }
}

export type ListCategoriesInput = SearchInput;

export type ListCategoriesOutput = CategoryOutput[];
