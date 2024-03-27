import request from 'supertest';
import { ICategoryRepository } from '../../src/core/category/domain/category.repository';
import * as CategoryProviders from '../../src/nest-modules/categories-module/categories.providers';
import { startApp } from '../../src/nest-modules/shared-module/testing/helpers';
import { Category } from '../../src/core/category/domain/category.aggregate';

describe('CategoriesResource (e2e)', () => {
  describe('query category', () => {
    const nestApp = startApp();
    it('should return a category', async () => {
      const categoryRepo = nestApp.app.get<ICategoryRepository>(
        CategoryProviders.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );

      const category = Category.fake().aCategory().withName('b').build();
      await categoryRepo.insert(category);
      await request(nestApp.app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
              query {
                category(id: "${category.category_id.id}") {
                  id
                  name
                  description
                  is_active
                  created_at
                }
              }
            `,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({
          data: {
            category: {
              id: category.category_id.id,
              name: 'b',
              description: category.description,
              is_active: true,
              created_at: category.created_at.toISOString(),
            },
          },
        });
    });
  });
});
