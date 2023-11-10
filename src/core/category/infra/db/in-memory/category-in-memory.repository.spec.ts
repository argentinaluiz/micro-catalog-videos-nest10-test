import { Category } from '../../../domain/category.aggregate';
import { CategoryFakeBuilder } from '../../../domain/category-fake.builder';
import { CategoryInMemoryRepository } from './category-in-memory.repository';
import { UnitOfWorkFakeInMemory } from '../../../../shared/infra/db/in-memory/fake-unit-work-in-memory';

describe('CategoryInMemoryRepository', () => {
  let repository: CategoryInMemoryRepository;

  beforeEach(
    () =>
      (repository = new CategoryInMemoryRepository(
        new UnitOfWorkFakeInMemory(),
      )),
  );
  it('should no filter items when filter object is null', async () => {
    const items = [CategoryFakeBuilder.aCategory().build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(filterSpy).not.toHaveBeenCalled();
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items using filter parameter', async () => {
    const faker = CategoryFakeBuilder.aCategory();
    const items = [
      faker.withName('test').build(),
      faker.withName('TEST').build(),
      faker.withName('fake').build(),
    ];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, 'TEST');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();
    const faker = CategoryFakeBuilder.aCategory();
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
      Category.create({ name: 'c' }),
      Category.create({ name: 'b' }),
      Category.create({ name: 'a' }),
    ];

    let itemsSorted = await repository['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repository['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
