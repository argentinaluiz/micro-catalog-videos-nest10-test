import {
  VideoElasticSearchMapper,
  VideoElasticSearchRepository,
} from '../video-elastic-search';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import {
  VideoSearchParams,
  VideoSearchResult,
} from '../../../../domain/video.repository';
import { Category } from '../../../../../category/domain/category.aggregate';
import { Rating } from '../../../../domain/rating.vo';
import { CastMember } from '../../../../../cast-member/domain/cast-member.aggregate';
import { Genre } from '../../../../../genre/domain/genre.aggregate';

describe('VideoElasticSearchRepository Integration Tests', () => {
  const esHelper = setupElasticSearch();
  let repository: VideoElasticSearchRepository;

  beforeEach(async () => {
    repository = new VideoElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
  });

  test('should inserts a new entity', async () => {
    const video = Video.create({
      video_id: new VideoId(),
      title: 'Movie',
      description: 'Movie description',
      year_launched: 2021,
      duration: 120,
      rating: Rating.create10(),
      is_opened: true,
      is_published: true,
      banner_url: 'http://banner.com',
      thumbnail_url: 'http://thumbnail.com',
      thumbnail_half_url: 'http://thumbnail_half.com',
      trailer_url: 'http://trailer.com',
      video_url: 'http://video.com',
      categories_props: [Category.fake().aNestedCategory().build()],
      genres_props: [Genre.fake().aNestedGenre().build()],
      cast_members_props: [CastMember.fake().aDirector().build()],
      created_at: new Date(),
    });
    await repository.insert(video);
    const entity = await repository.findById(video.video_id);
    expect(entity!.toJSON()).toStrictEqual(video.toJSON());
  });

  test('should insert many entities', async () => {
    const videos = Video.fake().theVideosWithAllMedias(2).build();
    await repository.bulkInsert(videos);
    const { exists: foundVideos } = await repository.findByIds(
      videos.map((g) => g.video_id),
    );
    expect(foundVideos.length).toBe(2);
    expect(foundVideos[0].toJSON()).toStrictEqual(videos[0].toJSON());
    expect(foundVideos[1].toJSON()).toStrictEqual(videos[1].toJSON());
  });

  it('should finds a entity by id', async () => {
    let entityFound = await repository.findById(new VideoId());
    expect(entityFound).toBeNull();

    const entity = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(entity);
    entityFound = await repository.findById(entity.video_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());

    entity.markAsDeleted();

    await repository.ignoreSoftDeleted().update(entity);
    await expect(repository.findById(entity.video_id)).resolves.toBeNull();
  });

  it('should return all videos', async () => {
    const entity = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(entity);
    let entities = await repository.findAll();
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));

    entity.markAsDeleted();

    await repository.update(entity);
    entities = await repository.ignoreSoftDeleted().findAll();
    expect(entities).toHaveLength(0);
  });

  it('should return a videos list by ids', async () => {
    const videos = Video.fake().theVideosWithAllMedias(2).build();

    await repository.bulkInsert(videos);
    const { exists: foundVideos } = await repository.findByIds(
      videos.map((g) => g.video_id),
    );
    expect(foundVideos.length).toBe(2);
    expect(foundVideos[0].toJSON()).toStrictEqual(videos[0].toJSON());
    expect(foundVideos[1].toJSON()).toStrictEqual(videos[1].toJSON());

    videos[0].markAsDeleted();
    videos[1].markAsDeleted();

    Promise.all([
      await repository.update(videos[0]),
      await repository.update(videos[1]),
    ]);

    const { exists: foundVideos2 } = await repository
      .ignoreSoftDeleted()
      .findByIds(videos.map((g) => g.video_id));
    expect(foundVideos2.length).toBe(0);
  });

  it('should return video id that exists', async () => {
    const video = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(video);

    await repository.insert(video);
    const existsResult1 = await repository.existsById([video.video_id]);
    expect(existsResult1.exists[0]).toBeValueObject(video.video_id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const genreId1 = new VideoId();
    const genreId2 = new VideoId();
    const notExistsResult = await repository.existsById([genreId1, genreId2]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(genreId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(genreId2);

    const existsResult2 = await repository.existsById([
      video.video_id,
      genreId1,
    ]);

    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(video.video_id);
    expect(existsResult2.not_exists[0]).toBeValueObject(genreId1);

    video.markAsDeleted();

    await repository.update(video);
    const existsResult3 = await repository
      .ignoreSoftDeleted()
      .existsById([video.video_id]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(video.video_id);
  });

  it('should throw error on update when a entity not found', async () => {
    const entity = Video.fake().aVideoWithAllMedias().build();
    await expect(repository.update(entity)).rejects.toThrow(
      new NotFoundError(entity.video_id.id, Video),
    );

    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);

    await expect(repository.ignoreSoftDeleted().update(entity)).rejects.toThrow(
      new NotFoundError(entity.video_id.id, Video),
    );
  });

  it('should update a entity', async () => {
    const entity = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(entity);

    entity.changeTitle('Movie updated');
    await repository.update(entity);

    const entityFound = await repository.findById(entity.video_id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const genreId = new VideoId();
    await expect(repository.delete(genreId)).rejects.toThrow(
      new NotFoundError(genreId.id, Video),
    );

    const entity = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(entity);
    entity.markAsDeleted();
    await repository.update(entity);
    expect(
      repository.ignoreSoftDeleted().delete(entity.video_id),
    ).rejects.toThrow(new NotFoundError(entity.video_id.id, Video));
  });

  it('should delete a entity', async () => {
    const entity = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(entity);

    await repository.delete(entity.video_id);
    const document = await esHelper.esClient.search({
      index: esHelper.indexName,
      query: {
        match: {
          _id: entity.video_id.id,
        },
      },
    });
    expect(document.hits.hits.length).toBe(0);
  });

  describe('search method tests', () => {
    it('should only apply paginate and order by created desc when other params are null', async () => {
      const videos = Video.fake()
        .theVideosWithAllMedias(16)
        .withTitle((index) => `Comedy ${index}`)
        .withCreatedAt((index) => new Date(new Date().getTime() + 100 + index))
        .build();
      await repository.bulkInsert(videos);
      const spyToEntity = jest.spyOn(VideoElasticSearchMapper, 'toEntity');

      const searchOutput = await repository.search(VideoSearchParams.create());
      expect(searchOutput).toBeInstanceOf(VideoSearchResult);
      expect(spyToEntity).toHaveBeenCalledTimes(15);
      expect(searchOutput.toJSON()).toMatchObject({
        total: 16,
        current_page: 1,
        last_page: 2,
        per_page: 15,
      });
      searchOutput.items.forEach((item) => {
        expect(item).toBeInstanceOf(Video);
        expect(item.video_id).toBeDefined();
      });
      const items = searchOutput.items.map((item) => item.toJSON());
      expect(items).toMatchObject(
        [...videos]
          .reverse()
          .slice(0, 15)
          .map((item) => item.toJSON()),
      );

      videos[0].markAsDeleted();

      await repository.update(videos[0]);

      const searchOutput2 = await repository
        .ignoreSoftDeleted()
        .search(VideoSearchParams.create());
      expect(searchOutput2).toBeInstanceOf(VideoSearchResult);
      expect(searchOutput2.toJSON()).toMatchObject({
        total: 15,
        current_page: 1,
        last_page: 1,
        per_page: 15,
      });
    });

    it('should apply paginate and filter by title or description', async () => {
      const nestedCategories = Category.fake().theNestedCategories(3).build();
      const nestedGenres = Genre.fake().theNestedGenres(3).build();
      const nestedCastMembers = CastMember.fake().theNestedActors(3).build();
      const videos = [
        Video.fake()
          .aVideoWithAllMedias()
          .withTitle('test')
          .withDescription('description')
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedGenre(nestedGenres[2])
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .addNestedCastMember(nestedCastMembers[2])
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .withTitle('a')
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedGenre(nestedGenres[2])
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .addNestedCastMember(nestedCastMembers[2])
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .withTitle('xpto')
          .withDescription('TEST')
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedGenre(nestedGenres[2])
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .addNestedCastMember(nestedCastMembers[2])
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .withTitle('TeSt')
          .withDescription('description')
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedGenre(nestedGenres[2])
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .addNestedCastMember(nestedCastMembers[2])
          .build(),
      ];
      await repository.bulkInsert(videos);

      let searchOutput = await repository.search(
        VideoSearchParams.create({
          page: 1,
          per_page: 2,
          filter: { title_or_description: 'fest' },
        }),
      );

      let expected = new VideoSearchResult({
        items: [videos[0], videos[2]],
        total: 3,
        current_page: 1,
        per_page: 2,
      }).toJSON(true);
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
            genres: expect.arrayContaining([
              nestedGenres[0].toJSON(),
              nestedGenres[1].toJSON(),
              nestedGenres[2].toJSON(),
            ]),
            cast_members: expect.arrayContaining([
              nestedCastMembers[0].toJSON(),
              nestedCastMembers[1].toJSON(),
              nestedCastMembers[2].toJSON(),
            ]),
          },
          {
            ...expected.items[1],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
            genres: expect.arrayContaining([
              nestedGenres[0].toJSON(),
              nestedGenres[1].toJSON(),
              nestedGenres[2].toJSON(),
            ]),
            cast_members: expect.arrayContaining([
              nestedCastMembers[0].toJSON(),
              nestedCastMembers[1].toJSON(),
              nestedCastMembers[2].toJSON(),
            ]),
          },
        ],
      });

      expected = new VideoSearchResult({
        items: [videos[3]],
        total: 3,
        current_page: 2,
        per_page: 2,
      }).toJSON(true);
      searchOutput = await repository.search(
        VideoSearchParams.create({
          page: 2,
          per_page: 2,
          filter: { title_or_description: 'FEST' },
        }),
      );
      expect(searchOutput.toJSON(true)).toMatchObject({
        ...expected,
        items: [
          {
            ...expected.items[0],
            categories: expect.arrayContaining([
              nestedCategories[0].toJSON(),
              nestedCategories[1].toJSON(),
              nestedCategories[2].toJSON(),
            ]),
            genres: expect.arrayContaining([
              nestedGenres[0].toJSON(),
              nestedGenres[1].toJSON(),
              nestedGenres[2].toJSON(),
            ]),
            cast_members: expect.arrayContaining([
              nestedCastMembers[0].toJSON(),
              nestedCastMembers[1].toJSON(),
              nestedCastMembers[2].toJSON(),
            ]),
          },
        ],
      });
    });

    it('should apply paginate and filter by categories_id', async () => {
      const nestedCategories = Category.fake().theNestedCategories(4).build();
      const nestedGenres = Genre.fake().aNestedGenre().build();
      const nestedCastMembers = CastMember.fake().aNestedActor().build();

      const videos = [
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategories[0])
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers)
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers)
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategories[0])
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers)
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategories[3])
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers)
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategories[1])
          .addNestedCategory(nestedCategories[2])
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers)
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
      ];
      await repository.bulkInsert(videos);
      const arrange = [
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: { categories_id: [nestedCategories[0].category_id.id] },
          }),
          result: {
            items: [videos[2], videos[1]],
            total: 3,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: { categories_id: [nestedCategories[0].category_id.id] },
          }),
          result: {
            items: [videos[0]],
            total: 3,
            current_page: 2,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: {
              categories_id: [
                nestedCategories[0].category_id.id,
                nestedCategories[1].category_id.id,
              ],
            },
          }),
          result: {
            items: [videos[4], videos[2]],
            total: 4,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: {
              categories_id: [
                nestedCategories[0].category_id.id,
                nestedCategories[1].category_id.id,
              ],
            },
          }),
          result: {
            items: [videos[1], videos[0]],
            total: 4,
            current_page: 2,
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
            expect.objectContaining({
              ...expected,
              categories: expect.arrayContaining(expected.categories),
              genres: expect.arrayContaining(expected.genres),
              cast_members: expect.arrayContaining(expected.cast_members),
            }),
          );
        });
      }
    });

    it('should apply paginate and filter by genres_id', async () => {
      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedGenres = Genre.fake().theNestedGenres(4).build();
      const nestedCastMember = CastMember.fake().aNestedActor().build();
      const videos = [
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres[0])
          .addNestedCastMember(nestedCastMember)
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedCastMember(nestedCastMember)
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedGenre(nestedGenres[2])
          .addNestedCastMember(nestedCastMember)
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres[0])
          .addNestedCastMember(nestedCastMember)
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres[0])
          .addNestedGenre(nestedGenres[1])
          .addNestedCastMember(nestedCastMember)
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
      ];
      await repository.bulkInsert(videos);

      const arrange = [
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: { genres_id: [nestedGenres[0].genre_id.id] },
          }),
          result: {
            items: [videos[4], videos[3]],
            total: 5,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: { genres_id: [nestedGenres[0].genre_id.id] },
          }),
          result: {
            items: [videos[2], videos[1]],
            total: 5,
            current_page: 2,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: {
              genres_id: [
                nestedGenres[0].genre_id.id,
                nestedGenres[1].genre_id.id,
              ],
            },
          }),
          result: {
            items: [videos[4], videos[3]],
            total: 5,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: {
              genres_id: [
                nestedGenres[0].genre_id.id,
                nestedGenres[1].genre_id.id,
              ],
            },
          }),
          result: {
            items: [videos[2], videos[1]],
            total: 5,
            current_page: 2,
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
            expect.objectContaining({
              ...expected,
              categories: expect.arrayContaining(expected.categories),
              genres: expect.arrayContaining(expected.genres),
              cast_members: expect.arrayContaining(expected.cast_members),
            }),
          );
        });
      }
    });

    it('should apply paginate and filter by cast_members_id', async () => {
      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedGenres = Genre.fake().aNestedGenre().build();
      const nestedCastMembers = CastMember.fake().theNestedActors(4).build();
      const videos = [
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers[0])
          .withCreatedAt(new Date(new Date().getTime() + 1000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .withCreatedAt(new Date(new Date().getTime() + 2000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .addNestedCastMember(nestedCastMembers[2])
          .withCreatedAt(new Date(new Date().getTime() + 3000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers[0])
          .withCreatedAt(new Date(new Date().getTime() + 4000))
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenres)
          .addNestedCastMember(nestedCastMembers[0])
          .addNestedCastMember(nestedCastMembers[1])
          .withCreatedAt(new Date(new Date().getTime() + 5000))
          .build(),
      ];
      await repository.bulkInsert(videos);

      const arrange = [
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: {
              cast_members_id: [nestedCastMembers[0].cast_member_id.id],
            },
          }),
          result: {
            items: [videos[4], videos[3]],
            total: 5,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: {
              cast_members_id: [nestedCastMembers[0].cast_member_id.id],
            },
          }),
          result: {
            items: [videos[2], videos[1]],
            total: 5,
            current_page: 2,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            filter: {
              cast_members_id: [
                nestedCastMembers[0].cast_member_id.id,
                nestedCastMembers[1].cast_member_id.id,
              ],
            },
          }),
          result: {
            items: [videos[4], videos[3]],
            total: 5,
            current_page: 1,
            per_page: 2,
          },
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            filter: {
              cast_members_id: [
                nestedCastMembers[0].cast_member_id.id,
                nestedCastMembers[1].cast_member_id.id,
              ],
            },
          }),
          result: {
            items: [videos[2], videos[1]],
            total: 5,
            current_page: 2,
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
            expect.objectContaining({
              ...expected,
              categories: expect.arrayContaining(expected.categories),
              genres: expect.arrayContaining(expected.genres),
              cast_members: expect.arrayContaining(expected.cast_members),
            }),
          );
        });
      }
    });

    it('should apply paginate and sort', async () => {
      expect(repository.sortableFields).toStrictEqual(['title', 'created_at']);

      const nestedCategory = Category.fake().aNestedCategory().build();
      const nestedGenre = Genre.fake().aNestedGenre().build();
      const nestedCastMember = CastMember.fake().aNestedActor().build();
      const videos = [
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenre)
          .addNestedCastMember(nestedCastMember)
          .withTitle('b')
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenre)
          .addNestedCastMember(nestedCastMember)
          .withTitle('a')
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenre)
          .addNestedCastMember(nestedCastMember)
          .withTitle('d')
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenre)
          .addNestedCastMember(nestedCastMember)
          .withTitle('e')
          .build(),
        Video.fake()
          .aVideoWithAllMedias()
          .addNestedCategory(nestedCategory)
          .addNestedGenre(nestedGenre)
          .addNestedCastMember(nestedCastMember)
          .withTitle('c')
          .build(),
      ];
      await repository.bulkInsert(videos);

      const arrange = [
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'title',
          }),
          result: new VideoSearchResult({
            items: [videos[1], videos[0]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'title',
          }),
          result: new VideoSearchResult({
            items: [videos[4], videos[2]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
        {
          params: VideoSearchParams.create({
            page: 1,
            per_page: 2,
            sort: 'title',
            sort_dir: 'desc',
          }),
          result: new VideoSearchResult({
            items: [videos[3], videos[2]],
            total: 5,
            current_page: 1,
            per_page: 2,
          }),
        },
        {
          params: VideoSearchParams.create({
            page: 2,
            per_page: 2,
            sort: 'title',
            sort_dir: 'desc',
          }),
          result: new VideoSearchResult({
            items: [videos[4], videos[0]],
            total: 5,
            current_page: 2,
            per_page: 2,
          }),
        },
      ];

      for (const i of arrange) {
        const result = await repository.search(i.params);
        const expected = i.result.toJSON(true);

        expect(result.toJSON(true)).toMatchObject({
          ...expected,
          items: expected.items.map((i) => ({
            ...i,
            categories: expect.arrayContaining(i.categories),
            genres: expect.arrayContaining(i.genres),
            cast_members: expect.arrayContaining(i.cast_members),
          })),
        });
      }
    });
  });

  describe('should search using filter by title_or_description, categories_id, genres_id, cast_members and sort and paginate', () => {
    const nestedCategories = Category.fake().theNestedCategories(4).build();
    const nestedGenres = Genre.fake().theNestedGenres(4).build();
    const nestedCastMembers = CastMember.fake().theNestedActors(4).build();

    const videos = [
      Video.fake()
        .aVideoWithAllMedias()
        .addNestedCategory(nestedCategories[0])
        .addNestedGenre(nestedGenres[0])
        .addNestedCastMember(nestedCastMembers[0])
        .withTitle('test')
        .withDescription('description')
        .withCreatedAt(new Date(new Date().getTime() + 1000))
        .build(),
      Video.fake()
        .aVideoWithAllMedias()
        .addNestedCategory(nestedCategories[0])
        .addNestedGenre(nestedGenres[0])
        .addNestedCastMember(nestedCastMembers[0])
        .withTitle('a')
        .withCreatedAt(new Date(new Date().getTime() + 2000))
        .build(),
      Video.fake()
        .aVideoWithAllMedias()
        .addNestedCategory(nestedCategories[0])
        .addNestedGenre(nestedGenres[0])
        .addNestedCastMember(nestedCastMembers[0])
        .withTitle('xpto')
        .withDescription('TEST')
        .withCreatedAt(new Date(new Date().getTime() + 3000))
        .build(),
      Video.fake()
        .aVideoWithAllMedias()
        .addNestedCategory(nestedCategories[0])
        .addNestedGenre(nestedGenres[0])
        .addNestedCastMember(nestedCastMembers[0])
        .withTitle('TeSt')
        .withDescription('description')
        .withCreatedAt(new Date(new Date().getTime() + 4000))
        .build(),
      Video.fake()
        .aVideoWithAllMedias()
        .addNestedCategory(nestedCategories[0])
        .addNestedGenre(nestedGenres[0])
        .addNestedCastMember(nestedCastMembers[0])
        .withTitle('c')
        .withDescription('description')
        .withCreatedAt(new Date(new Date().getTime() + 5000))
        .build(),
    ];

    const arrange = [
      {
        search_params: VideoSearchParams.create({
          page: 1,
          per_page: 2,
          sort: 'title',
          filter: {
            title_or_description: 'test',
            categories_id: [nestedCategories[0].category_id],
            genres_id: [nestedGenres[0].genre_id],
            cast_members_id: [nestedCastMembers[0].cast_member_id],
          },
        }),
        search_result: new VideoSearchResult({
          items: [videos[3], videos[0]],
          total: 3,
          current_page: 1,
          per_page: 2,
        }),
      },
      {
        search_params: VideoSearchParams.create({
          page: 2,
          per_page: 2,
          sort: 'title',
          filter: {
            title_or_description: 'test',
            categories_id: [nestedCategories[0].category_id],
            genres_id: [nestedGenres[0].genre_id],
            cast_members_id: [nestedCastMembers[0].cast_member_id],
          },
        }),
        search_result: new VideoSearchResult({
          items: [videos[2]],
          total: 3,
          current_page: 2,
          per_page: 2,
        }),
      },
    ];

    beforeEach(async () => {
      await repository.bulkInsert(videos);
    });

    test.each(arrange)(
      'when value is $search_params',
      async ({ search_params, search_result: expected_result }) => {
        const result = await repository.search(search_params);
        const expected = expected_result.toJSON(true);
        expect(result.toJSON(true)).toMatchObject({
          ...expected,
          items: expected.items.map((i) => ({
            ...i,
            categories: expect.arrayContaining(i.categories),
            genres: expect.arrayContaining(i.genres),
            cast_members: expect.arrayContaining(i.cast_members),
          })),
        });
      },
    );
  });
});
