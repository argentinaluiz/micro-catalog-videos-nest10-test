import { Genre } from '../../../domain/genre.aggregate';
import { GenreFakeBuilder } from '../../../domain/genre-fake.builder';
import { GenreInMemoryRepository } from './genre-in-memory.repository';
import { Category, CategoryId } from '../../../../category/domain/category.aggregate';

describe('GenreInMemoryRepository', () => {
  let repository: GenreInMemoryRepository;

  beforeEach(() => (repository = new GenreInMemoryRepository()));

  it('should no filter items when filter object is null', async () => {
    const items = [GenreFakeBuilder.aGenre().build()];

    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items by name', async () => {
    const faker = Genre.fake().aGenre();
    const items = [
      faker.withName('test').build(),
      faker.withName('TEST').build(),
      faker.withName('fake').build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, {
      name: 'TEST',
    });
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should filter items by categories_id', async () => {
    const nestedCategory1 = Category.fake().aNestedCategory().build();
    const nestedCategory2 = Category.fake().aNestedCategory().build();
    const nestedCategory3 = Category.fake().aNestedCategory().build();
    const nestedCategory4 = Category.fake().aNestedCategory().build();
    const items = [
      Genre.fake()
        .aGenre()
        .addNestedCategory(nestedCategory1)
        .addNestedCategory(nestedCategory2)
        .build(),
      Genre.fake()
        .aGenre()
        .addNestedCategory(nestedCategory3)
        .addNestedCategory(nestedCategory4)
        .build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    let itemsFiltered = await repository['applyFilter'](items, {
      categories_id: [nestedCategory1.category_id],
    });
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0]]);

    itemsFiltered = await repository['applyFilter'](items, {
      categories_id: [nestedCategory2.category_id],
    });
    expect(filterSpy).toHaveBeenCalledTimes(2);
    expect(itemsFiltered).toStrictEqual([items[0]]);

    itemsFiltered = await repository['applyFilter'](items, {
      categories_id: [nestedCategory1.category_id, nestedCategory2.category_id],
    });
    expect(filterSpy).toHaveBeenCalledTimes(3);
    expect(itemsFiltered).toStrictEqual([items[0]]);

    itemsFiltered = await repository['applyFilter'](items, {
      categories_id: [nestedCategory1.category_id, nestedCategory3.category_id],
    });
    expect(filterSpy).toHaveBeenCalledTimes(4);
    expect(itemsFiltered).toStrictEqual([...items]);

    itemsFiltered = await repository['applyFilter'](items, {
      categories_id: [nestedCategory3.category_id, nestedCategory1.category_id],
    });
    expect(filterSpy).toHaveBeenCalledTimes(5);
    expect(itemsFiltered).toStrictEqual([...items]);
  });

  it('should filter items by name and categories_id', async () => {
    const nestedCategory1 = Category.fake().aNestedCategory().build();
    const nestedCategory2 = Category.fake().aNestedCategory().build();
    const nestedCategory3 = Category.fake().aNestedCategory().build();
    const nestedCategory4 = Category.fake().aNestedCategory().build();
    const items = [
      Genre.fake()
        .aGenre()
        .withName('test')
        .addNestedCategory(nestedCategory1)
        .addNestedCategory(nestedCategory2)
        .build(),
      Genre.fake()
        .aGenre()
        .withName('fake')
        .addNestedCategory(nestedCategory3)
        .addNestedCategory(nestedCategory4)
        .build(),
      Genre.fake()
        .aGenre()
        .withName('test fake')
        .addNestedCategory(nestedCategory1)
        .build(),
    ];

    let itemsFiltered = await repository['applyFilter'](items, {
      name: 'test',
      categories_id: [nestedCategory1.category_id],
    });
    expect(itemsFiltered).toStrictEqual([items[0], items[2]]);

    itemsFiltered = await repository['applyFilter'](items, {
      name: 'test',
      categories_id: [nestedCategory3.category_id],
    });
    expect(itemsFiltered).toStrictEqual([]);

    itemsFiltered = await repository['applyFilter'](items, {
      name: 'fake',
      categories_id: [nestedCategory4.category_id],
    });
    expect(itemsFiltered).toStrictEqual([items[1]]);
  });

  it('should not filter deleted items', async () => {
    const items = [
      GenreFakeBuilder.aGenre().build(),
      GenreFakeBuilder.aGenre().build(),
    ];
    repository.items = items;
    items[0].markAsDeleted();

    const output = await repository['applyFilter'](items, null);
    expect(output).toStrictEqual([items[1]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();
    const faker = GenreFakeBuilder.aGenre();
    const items = [
      faker.withName('test').withCreatedAt(created_at).build(),
      faker
        .withName('TEST')
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      faker
        .withName('fake')
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];

    const itemsSorted = await repository['applySort'](items, null, null);
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('should sort by name', async () => {
    const items = [
      Genre.fake().aGenre().withName('c').build(),
      Genre.fake().aGenre().withName('b').build(),
      Genre.fake().aGenre().withName('a').build(),
    ];

    let itemsSorted = await repository['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repository['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
