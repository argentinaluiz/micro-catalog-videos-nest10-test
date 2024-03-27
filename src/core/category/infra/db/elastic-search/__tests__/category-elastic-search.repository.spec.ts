import {
  CategoryElasticSearchMapper,
  CategoryElasticSearchRepository,
} from '../category-elastic-search';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import {
  CategorySearchParams,
  CategorySearchResult,
} from '../../../../domain/category.repository';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  const esHelper = setupElasticSearch();
  let repository: CategoryElasticSearchRepository;

  beforeEach(async () => {
    repository = new CategoryElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
  });

  test('should inserts a new entity', async () => {
    const category = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    const entity = await repository.findById(category.category_id);
    expect(entity!.toJSON()).toStrictEqual(category.toJSON());
  });

  test('should insert many entities', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(
      categories.map((g) => g.category_id),
    );
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });

  it('should delete a entity', async () => {
    const entity = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    await repository.delete(entity.category_id);
    const document = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.category_id.id,
        },
      },
    });
    expect(document.hits.hits.length).toBe(0);

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await repository.delete(entity.category_id);
    const document2 = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.category_id.id,
        },
      },
    });
    expect(document2.hits.hits.length).toBe(0);
  });

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new CategoryId());
    expect(entityFound).toBeNull();

    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    entityFound = await repository.findById(entity.category_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entity.markAsDeleted();

    await repository.update(entity);
    await expect(repository.findById(entity.category_id)).resolves.toBeNull();
  });

  it('should find a entity by filter', async () => {
    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    let entityFound = await repository.findOneBy({
      category_id: entity.category_id,
    });
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    expect(repository.findOneBy({ is_active: true })).resolves.toBeNull();

    entityFound = await repository.findOneBy({
      category_id: entity.category_id,
      is_active: false,
    });
    expect(entityFound?.toJSON()).toStrictEqual(entity.toJSON());

    entity.markAsDeleted();

    await repository.update(entity);

    expect(
      repository.findOneBy({ category_id: entity.category_id }),
    ).resolves.toBeNull();
  });

  it('should find entities by filter and order', async () => {
    const categories = [
      Category.fake().aCategory().withName('a').build(),
      Category.fake().aCategory().withName('b').build(),
    ];

    await repository.bulkInsert(categories);

    let entities = await repository.findBy(
      { is_active: true },
      {
        field: 'name',
        direction: 'asc',
      },
    );

    expect(entities).toStrictEqual([categories[0], categories[1]]);

    entities = await repository.findBy(
      { is_active: true },
      {
        field: 'name',
        direction: 'desc',
      },
    );

    expect(entities).toStrictEqual([categories[1], categories[0]]);
  });

  it('should find entities by filter', async () => {
    const entity = Category.create({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);

    let entities = await repository.findBy({ category_id: entity.category_id });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entities = await repository.findBy({ is_active: true });
    expect(entities).toHaveLength(0);

    entities = await repository.findBy({
      category_id: entity.category_id,
      is_active: false,
    });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);

    entities = await repository.findBy({ category_id: entity.category_id });
    expect(entities).toHaveLength(0);
  });

  it('should return all categories', async () => {
    const entity = new Category({
      category_id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.findAll();
    expect(entities).toHaveLength(0);
  });

  it('should return a categories list by ids', async () => {
    const categories = Category.fake().theCategories(2).build();

    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(
      categories.map((g) => g.category_id),
    );
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());

    categories[0].markAsDeleted();
    categories[1].markAsDeleted();

    Promise.all([
      await repository.update(categories[0]),
      await repository.update(categories[1]),
    ]);

    const { exists: foundCategories2 } = await repository.findByIds(
      categories.map((g) => g.category_id),
    );
    expect(foundCategories2.length).toBe(0);
  });

  it('should return category id that exists', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);

    await repository.insert(category);
    const existsResult1 = await repository.existsById([category.category_id]);
    expect(existsResult1.exists[0]).toBeValueObject(category.category_id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const notExistsResult = await repository.existsById([
      categoryId1,
      categoryId2,
    ]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(categoryId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(categoryId2);

    const existsResult2 = await repository.existsById([
      category.category_id,
      categoryId1,
    ]);

    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(category.category_id);
    expect(existsResult2.not_exists[0]).toBeValueObject(categoryId1);

    category.markAsDeleted();

    await repository.update(category);
    const existsResult3 = await repository.existsById([category.category_id]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(category.category_id);
  });

  it('should throw error on update when a entity not found', async () => {
    const entity = Category.fake().aCategory().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.category_id.id, Category),
    );

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.category_id.id, Category),
    );
  });

  it('should update a entity', async () => {
    const entity = Category.fake().aCategory().build();
    await repository.insert(entity);

    entity.changeName('Movie updated');
    await repository.update(entity);

    const entityFound = await repository.findById(entity.category_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(repository.delete(categoryId)).rejects.toThrow(
      new NotFoundError(categoryId.id, Category),
    );
  });

  describe('search method tests', () => {
    it('should only apply paginate when other params are null', async () => {
      const categories = Category.fake()
        .theCategories(16)
        .withName((index) => `Movie ${index}`)
        .withName('Movie')
        .withDescription(null)
        .withCreatedAt((index) => new Date(new Date().getTime() + 100 + index))
        .build();
      await repository.bulkInsert(categories);
      const spyToEntity = jest.spyOn(CategoryElasticSearchMapper, 'toEntity');

      const searchOutput = await repository.search(
        CategorySearchParams.create(),
      );
      expect(searchOutput).toBeInstanceOf(CategorySearchResult);
      expect(spyToEntity).toHaveBeenCalledTimes(15);
      expect(searchOutput.toJSON()).toMatchObject({
        total: 16,
        current_page: 1,
        last_page: 2,
        per_page: 15,
      });
      searchOutput.items.forEach((item) => {
        expect(item).toBeInstanceOf(Category);
        expect(item.category_id).toBeDefined();
      });
      const items = searchOutput.items.map((item) => item.toJSON());
      expect(items).toMatchObject(
        [...categories]
          .reverse()
          .slice(0, 15)
          .map((item) => item.toJSON()),
      );

      categories[0].markAsDeleted();

      await repository.update(categories[0]);

      const searchOutput2 = await repository.search(
        CategorySearchParams.create(),
      );
      expect(searchOutput2).toBeInstanceOf(CategorySearchResult);
      expect(searchOutput2.toJSON()).toMatchObject({
        total: 15,
        current_page: 1,
        last_page: 1,
        per_page: 15,
      });
    });

    it('should order by created_at DESC when search params are null', async () => {
      const created_at = new Date();
      const categories = Category.fake()
        .theCategories(16)
        .withName((index) => `Movie ${index}`)
        .withDescription(null)
        .withCreatedAt((index) => new Date(created_at.getTime() + index))
        .build();
      const searchOutput = await repository.search(
        CategorySearchParams.create(),
      );
      const items = searchOutput.items;
      [...items].reverse().forEach((item, index) => {
        expect(`Movie ${index}`).toBe(`${categories[index + 1].name}`);
      });
    });

    it('should apply paginate and filter', async () => {
      const categories = [
        Category.fake()
          .aCategory()
          .withName('test')
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
        Category.fake()
          .aCategory()
          .withName('a')
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Category.fake()
          .aCategory()
          .withName('TEST')
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Category.fake()
          .aCategory()
          .withName('TeSt')
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .deactivate()
          .build(),
      ];

      await repository.bulkInsert(categories);

      let searchOutput = await repository.search(
        CategorySearchParams.create({
          page: 1,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject(
        new CategorySearchResult({
          items: [categories[0], categories[2]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }).toJSON(true),
      );

      searchOutput = await repository.search(
        CategorySearchParams.create({
          page: 2,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject(
        new CategorySearchResult({
          items: [categories[3]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }).toJSON(true),
      );

      searchOutput = await repository.search(
        CategorySearchParams.create({
          page: 1,
          per_page: 2,
          filter: { name: 'TEST', is_active: false },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject(
        new CategorySearchResult({
          items: [categories[3]],
          total: 1,
          current_page: 1,
          per_page: 2,
        }).toJSON(true),
      );
    });

    it('should apply paginate and sort', async () => {
      expect(repository.sortableFields).toStrictEqual(['name', 'created_at']);

      const categories = [
        Category.fake().aCategory().withName('b').build(),
        Category.fake().aCategory().withName('a').build(),
        Category.fake().aCategory().withName('d').build(),
        Category.fake().aCategory().withName('e').build(),
        Category.fake().aCategory().withName('c').build(),
      ];
      await repository.bulkInsert(categories);

      const arrange = [
        {
          params: CategorySearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
          }),
          result: new CategorySearchResult({
            items: [categories[1], categories[0]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: CategorySearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
          }),
          result: new CategorySearchResult({
            items: [categories[4], categories[2]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
        {
          params: CategorySearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new CategorySearchResult({
            items: [categories[3], categories[2]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: CategorySearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new CategorySearchResult({
            items: [categories[4], categories[0]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
      ];

      for (const i of arrange) {
        const result = await repository.search(i.params);
        expect(result.toJSON(true)).toMatchObject(i.result.toJSON(true));
      }
    });

    describe('should search using filter, sort and paginate', () => {
      const categories = [
        Category.fake().aCategory().withName('test').build(),
        Category.fake().aCategory().withName('a').build(),
        Category.fake().aCategory().withName('TEST').build(),
        Category.fake().aCategory().withName('e').build(),
        Category.fake().aCategory().withName('TeSt').build(),
      ];

      const arrange = [
        {
          search_params: CategorySearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
            filter: { name: 'TEST' },
          }),
          search_result: new CategorySearchResult({
            items: [categories[2], categories[4]],
            total: 3,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          search_params: CategorySearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
            filter: { name: 'TEST' },
          }),
          search_result: new CategorySearchResult({
            items: [categories[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
          }),
        },
        {
          search_params: CategorySearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
            filter: { name: 'TEST', is_active: true },
          }),
          search_result: new CategorySearchResult({
            items: [categories[2], categories[4]],
            total: 3,
            current_page: 1,
            per_page: 2,
          }),
        },
      ];

      beforeEach(async () => {
        await repository.bulkInsert(categories);
      });

      test.each(arrange)(
        'when value is $search_params',
        async ({ search_params, search_result }) => {
          const result = await repository.search(search_params);
          expect(result.toJSON(true)).toMatchObject(search_result.toJSON(true));
        },
      );
    });
  });
});
