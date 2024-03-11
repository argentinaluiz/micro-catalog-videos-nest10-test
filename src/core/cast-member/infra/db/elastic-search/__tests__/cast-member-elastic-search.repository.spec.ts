import {
  CastMemberElasticSearchMapper,
  CastMemberElasticSearchRepository,
} from '../cast-member-elastic-search';
import {
  CastMember,
  CastMemberId,
} from '../../../../domain/cast-member.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import {
  CastMemberSearchParams,
  CastMemberSearchResult,
} from '../../../../domain/cast-member.repository';
import {
  CastMemberType,
  CastMemberTypes,
} from '../../../../domain/cast-member-type.vo';

describe('CastMemberElasticSearchRepository Integration Tests', () => {
  const esHelper = setupElasticSearch();
  let repository: CastMemberElasticSearchRepository;

  beforeEach(async () => {
    repository = new CastMemberElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
  });

  test('should inserts a new entity', async () => {
    const castMember = CastMember.create({
      cast_member_id: new CastMemberId(),
      name: 'Movie',
      type: CastMemberType.createAnActor(),
      created_at: new Date(),
    });
    await repository.insert(castMember);
    const entity = await repository.findById(castMember.cast_member_id);
    expect(entity!.toJSON()).toStrictEqual(castMember.toJSON());
  });

  test('should insert many entities', async () => {
    const castMembers = CastMember.fake().theCastMembers(2).build();
    await repository.bulkInsert(castMembers);
    const { exists: foundCastMembers } = await repository.findByIds(
      castMembers.map((g) => g.cast_member_id),
    );
    expect(foundCastMembers.length).toBe(2);
    expect(foundCastMembers[0].toJSON()).toStrictEqual(castMembers[0].toJSON());
    expect(foundCastMembers[1].toJSON()).toStrictEqual(castMembers[1].toJSON());
  });

  it('should delete a entity', async () => {
    const entity = CastMember.fake().aDirector().build();
    await repository.insert(entity);

    await repository.delete(entity.cast_member_id);
    const document = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.cast_member_id.id,
        },
      },
    });
    expect(document.hits.hits.length).toBe(0);

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await repository.delete(entity.cast_member_id);
    const document2 = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.cast_member_id.id,
        },
      },
    });
    expect(document2.hits.hits.length).toBe(0);
  });

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new CastMemberId());
    expect(entityFound).toBeNull();

    const entity = CastMember.fake().aDirector().build();
    await repository.insert(entity);
    entityFound = await repository.findById(entity.cast_member_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entity.markAsDeleted();

    await repository.update(entity);
    await expect(
      repository.findById(entity.cast_member_id),
    ).resolves.toBeNull();
  });

  it('should return all cast members', async () => {
    const entity = CastMember.fake().anActor().build();
    await repository.insert(entity);
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.findAll();
    expect(entities).toHaveLength(0);
  });

  it('should return a cast members list by ids', async () => {
    const castMembers = CastMember.fake().theCastMembers(2).build();

    await repository.bulkInsert(castMembers);
    const { exists: foundCastMembers } = await repository.findByIds(
      castMembers.map((g) => g.cast_member_id),
    );
    expect(foundCastMembers.length).toBe(2);
    expect(foundCastMembers[0].toJSON()).toStrictEqual(castMembers[0].toJSON());
    expect(foundCastMembers[1].toJSON()).toStrictEqual(castMembers[1].toJSON());

    castMembers[0].markAsDeleted();
    castMembers[1].markAsDeleted();

    Promise.all([
      await repository.update(castMembers[0]),
      await repository.update(castMembers[1]),
    ]);

    const { exists: foundCastMembers2 } = await repository.findByIds(
      castMembers.map((g) => g.cast_member_id),
    );
    expect(foundCastMembers2.length).toBe(0);
  });

  it('should return cast member id that exists', async () => {
    const castMember = CastMember.fake().anActor().build();
    await repository.insert(castMember);

    await repository.insert(castMember);
    const existsResult1 = await repository.existsById([
      castMember.cast_member_id,
    ]);
    expect(existsResult1.exists[0]).toBeValueObject(castMember.cast_member_id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const castMemberId1 = new CastMemberId();
    const castMemberId2 = new CastMemberId();
    const notExistsResult = await repository.existsById([
      castMemberId1,
      castMemberId2,
    ]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(castMemberId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(castMemberId2);

    const existsResult2 = await repository.existsById([
      castMember.cast_member_id,
      castMemberId1,
    ]);

    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(castMember.cast_member_id);
    expect(existsResult2.not_exists[0]).toBeValueObject(castMemberId1);

    castMember.markAsDeleted();

    await repository.update(castMember);
    const existsResult3 = await repository.existsById([
      castMember.cast_member_id,
    ]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(
      castMember.cast_member_id,
    );
  });

  it('should throw error on update when a entity not found', async () => {
    const entity = CastMember.fake().aDirector().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.cast_member_id.id, CastMember),
    );

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.cast_member_id.id, CastMember),
    );
  });

  it('should update a entity', async () => {
    const entity = CastMember.fake().aDirector().build();
    await repository.insert(entity);

    entity.changeName('Movie updated');
    await repository.update(entity);

    const entityFound = await repository.findById(entity.cast_member_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const castMemberId = new CastMemberId();
    await expect(repository.delete(castMemberId)).rejects.toThrow(
      new NotFoundError(castMemberId.id, CastMember),
    );
  });

  describe('search method tests', () => {
    it('should only apply paginate and order by created desc when other params are null', async () => {
      const castMembers = CastMember.fake()
        .theCastMembers(16)
        .withName((index) => `Comedy ${index}`)
        .withCreatedAt((index) => new Date(new Date().getTime() + 100 + index))
        .build();
      await repository.bulkInsert(castMembers);
      const spyToEntity = jest.spyOn(CastMemberElasticSearchMapper, 'toEntity');

      const searchOutput = await repository.search(
        CastMemberSearchParams.create(),
      );
      expect(searchOutput).toBeInstanceOf(CastMemberSearchResult);
      expect(spyToEntity).toHaveBeenCalledTimes(15);
      expect(searchOutput.toJSON()).toMatchObject({
        total: 16,
        current_page: 1,
        last_page: 2,
        per_page: 15,
      });
      searchOutput.items.forEach((item) => {
        expect(item).toBeInstanceOf(CastMember);
        expect(item.cast_member_id).toBeDefined();
      });
      const items = searchOutput.items.map((item) => item.toJSON());
      expect(items).toMatchObject(
        [...castMembers]
          .reverse()
          .slice(0, 15)
          .map((item) => item.toJSON()),
      );

      castMembers[0].markAsDeleted();

      await repository.update(castMembers[0]);

      const searchOutput2 = await repository.search(
        CastMemberSearchParams.create(),
      );
      expect(searchOutput2).toBeInstanceOf(CastMemberSearchResult);
      expect(searchOutput2.toJSON()).toMatchObject({
        total: 15,
        current_page: 1,
        last_page: 1,
        per_page: 15,
      });
    });

    it('should apply paginate and filter by name', async () => {
      const castMembers = [
        CastMember.fake()
          .anActor()
          .withName('test')
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        CastMember.fake()
          .anActor()
          .withName('a')
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        CastMember.fake()
          .anActor()
          .withName('TEST')
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        CastMember.fake()
          .anActor()
          .withName('TeSt')
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
      ];
      await repository.bulkInsert(castMembers);

      let searchOutput = await repository.search(
        CastMemberSearchParams.create({
          page: 1,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );

      let expected = new CastMemberSearchResult({
        items: [castMembers[0], castMembers[2]],
        total: 3,
        current_page: 1,
        per_page: 2,
      }).toJSON(true);
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [expected.items[0], expected.items[1]],
      });

      expected = new CastMemberSearchResult({
        items: [castMembers[3]],
        total: 3,
        current_page: 2,
        per_page: 2,
      }).toJSON(true);
      searchOutput = await repository.search(
        CastMemberSearchParams.create({
          page: 2,
          per_page: 2,
          filter: { name: 'TEST' },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [expected.items[0]],
      });
    });

    it('should apply paginate and filter by type', async () => {
      const created_at = new Date();
      const castMembers = [
        CastMember.fake()
          .anActor()
          .withName('actor1')
          .withCreatedAt(created_at)
          .build(),
        CastMember.fake()
          .anActor()
          .withName('actor2')
          .withCreatedAt(created_at)
          .build(),
        CastMember.fake()
          .anActor()
          .withName('actor3')
          .withCreatedAt(created_at)
          .build(),
        CastMember.fake()
          .aDirector()
          .withName('director1')
          .withCreatedAt(created_at)
          .build(),
        CastMember.fake()
          .aDirector()
          .withName('director2')
          .withCreatedAt(created_at)
          .build(),
        CastMember.fake()
          .aDirector()
          .withName('director3')
          .withCreatedAt(created_at)
          .build(),
      ];
      await repository.bulkInsert(castMembers);

      const arrange = [
        {
          params: CastMemberSearchParams.create({
            page: 1,
            per_page: 2,
            filter: { type: CastMemberTypes.ACTOR },
          }),
          result: {
            items: [castMembers[0], castMembers[1]],
            total: 3,
            current_page: 1,
          },
        },
        {
          params: CastMemberSearchParams.create({
            page: 2,
            per_page: 2,
            filter: { type: CastMemberTypes.ACTOR },
          }),
          result: {
            items: [castMembers[2]],
            total: 3,
            current_page: 2,
          },
        },
        {
          params: CastMemberSearchParams.create({
            page: 1,
            per_page: 2,
            filter: { type: CastMemberTypes.DIRECTOR },
          }),
          result: {
            items: [castMembers[3], castMembers[4]],
            total: 3,
            current_page: 1,
            per_page: 2,
          },
        },
      ];

      for (const arrangeItem of arrange) {
        const searchOutput = await repository.search(arrangeItem.params);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { items, ...otherOutput } = searchOutput;
        const { items: itemsExpected, ...otherExpected } = arrangeItem.result;
        expect(otherOutput).toMatchObject(otherExpected);
        expect(searchOutput.items.length).toBe(itemsExpected.length);
        searchOutput.items.forEach((item, key) => {
          const expected = itemsExpected[key].toJSON();
          expect(item.toJSON()).toStrictEqual(
            expect.objectContaining(expected),
          );
        });
      }
    });

    it('should apply paginate and sort', async () => {
      expect(repository.sortableFields).toStrictEqual(['name', 'created_at']);

      const castMembers = [
        CastMember.fake().anActor().withName('b').build(),
        CastMember.fake().anActor().withName('a').build(),
        CastMember.fake().anActor().withName('d').build(),
        CastMember.fake().anActor().withName('e').build(),
        CastMember.fake().anActor().withName('c').build(),
      ];
      await repository.bulkInsert(castMembers);

      const arrange = [
        {
          params: CastMemberSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
          }),
          result: new CastMemberSearchResult({
            items: [castMembers[1], castMembers[0]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: CastMemberSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
          }),
          result: new CastMemberSearchResult({
            items: [castMembers[4], castMembers[2]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
        {
          params: CastMemberSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new CastMemberSearchResult({
            items: [castMembers[3], castMembers[2]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: CastMemberSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'name',
            sort_dir: 'desc',
          }),
          result: new CastMemberSearchResult({
            items: [castMembers[4], castMembers[0]],
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
  });

  describe('should search using filter by name, sort and paginate', () => {
    const castMembers = [
      CastMember.fake().anActor().withName('test').build(),
      CastMember.fake().anActor().withName('a').build(),
      CastMember.fake().anActor().withName('TEST').build(),
      CastMember.fake().anActor().withName('e').build(),
      CastMember.fake().aDirector().withName('TeSt').build(),
    ];

    const arrange = [
      {
        search_params: CastMemberSearchParams.create({
          page: 1,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST' },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[2], castMembers[4]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }),
      },
      {
        search_params: CastMemberSearchParams.create({
          page: 2,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST' },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[0]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }),
      },
    ];

    beforeEach(async () => {
      await repository.bulkInsert(castMembers);
    });

    test.each(arrange)(
      'when value is $search_params',
      async ({ search_params, search_result }) => {
        const result = await repository.search(search_params);
        expect(result.toJSON(true)).toMatchObject(search_result.toJSON(true));
      },
    );
  });

  describe('should search using filter by type, sort and paginate', () => {
    const castMembers = [
      CastMember.fake().anActor().withName('test').build(),
      CastMember.fake().aDirector().withName('a').build(),
      CastMember.fake().anActor().withName('TEST').build(),
      CastMember.fake().aDirector().withName('e').build(),
      CastMember.fake().anActor().withName('TeSt').build(),
      CastMember.fake().aDirector().withName('b').build(),
    ];

    const arrange = [
      {
        search_params: CastMemberSearchParams.create({
          page: 1,
          per_page: 2,
          sort: 'name',
          filter: { type: CastMemberTypes.ACTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[2], castMembers[4]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }),
      },
      {
        search_params: CastMemberSearchParams.create({
          page: 2,
          per_page: 2,
          sort: 'name',
          filter: { type: CastMemberTypes.ACTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[0]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }),
      },
      {
        search_params: CastMemberSearchParams.create({
          page: 1,
          per_page: 2,
          sort: 'name',
          filter: { type: CastMemberTypes.DIRECTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[1], castMembers[5]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }),
      },
      {
        search_params: CastMemberSearchParams.create({
          page: 2,
          per_page: 2,
          sort: 'name',
          filter: { type: CastMemberTypes.DIRECTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[3]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }),
      },
    ];

    beforeEach(async () => {
      await repository.bulkInsert(castMembers);
    });

    test.each(arrange)(
      'when value is $search_params',
      async ({ search_params, search_result }) => {
        const result = await repository.search(search_params);
        expect(result.toJSON(true)).toMatchObject(search_result.toJSON(true));
      },
    );
  });

  describe('should search using filter by name and type, sort and paginate', () => {
    const castMembers = [
      CastMember.fake().anActor().withName('test').build(),
      CastMember.fake().aDirector().withName('a director').build(),
      CastMember.fake().anActor().withName('TEST').build(),
      CastMember.fake().aDirector().withName('e director').build(),
      CastMember.fake().anActor().withName('TeSt').build(),
      CastMember.fake().aDirector().withName('b director').build(),
    ];

    const arrange = [
      {
        search_params: CastMemberSearchParams.create({
          page: 1,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST', type: CastMemberTypes.ACTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[2], castMembers[4]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }),
      },
      {
        search_params: CastMemberSearchParams.create({
          page: 2,
          per_page: 2,
          sort: 'name',
          filter: { name: 'TEST', type: CastMemberTypes.ACTOR },
        }),
        search_result: new CastMemberSearchResult({
          items: [castMembers[0]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }),
      },
    ];

    beforeEach(async () => {
      await repository.bulkInsert(castMembers);
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
