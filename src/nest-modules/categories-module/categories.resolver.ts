import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoryGraphql } from './category.entity-graphql';
import { ListAllCategoriesUseCase } from '../../core/category/application/use-cases/list-all-categories/list-all-categories.use-case';
import { GetCategoryUseCase } from '../../core/category/application/use-cases/get-category/get-category.use-case';
import { Inject } from '@nestjs/common';

@Resolver(() => CategoryGraphql)
export class CategoriesResolver {
  @Inject(ListAllCategoriesUseCase)
  private listAllCategoriesUseCase: ListAllCategoriesUseCase;
  @Inject(GetCategoryUseCase)
  private getCategoryUseCase: GetCategoryUseCase;
  //constructor(private readonly testService: TestService) {}

  @Query(() => [CategoryGraphql], { name: 'categories' })
  async findAll() {
    const categories = await this.listAllCategoriesUseCase.execute();
    return categories.map((category) => new CategoryGraphql(category));
  }

  @Query(() => CategoryGraphql, { name: 'category' })
  async findOne(@Args('id', { type: () => String }) id: string) {
    const category = await this.getCategoryUseCase.execute({ id });
    return new CategoryGraphql(category);
  }
}
