import request from 'supertest';
import { ICategoryRepository } from '../../src/core/category/domain/category.repository';
import * as CategoryProviders from '../../src/nest-modules/categories-module/categories.providers';
import { startApp } from '../../src/nest-modules/shared-module/testing/helpers';
import { Category } from '../../src/core/category/domain/category.aggregate';

describe('CategoryResolver (e2e)', () => {
  describe('query categories', () => {
    const nestApp = startApp();
    it('should list all categories', async () => {
      const categoryRepo = nestApp.app.get<ICategoryRepository>(
        CategoryProviders.REPOSITORIES.CATEGORY_REPOSITORY.provide,
      );

      const categories = [
        Category.fake().aCategory().withName('b').build(),
        Category.fake().aCategory().withName('a').build(),
      ];
      await categoryRepo.bulkInsert(categories);
      await request(nestApp.app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
              query {
                categories {
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
            categories: [
              {
                id: categories[1].category_id.id,
                name: 'a',
                description: categories[1].description,
                is_active: true,
                created_at: categories[1].created_at.toISOString(),
              },
              {
                id: categories[0].category_id.id,
                name: 'b',
                description: categories[0].description,
                is_active: true,
                created_at: categories[0].created_at.toISOString(),
              },
            ],
          },
        });
    });
  });
});
