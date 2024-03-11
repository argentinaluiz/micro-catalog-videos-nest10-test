import { SaveCastMemberUseCase } from '../save-cast-member.use-case';
import {
  CastMember,
  CastMemberId,
} from '../../../../domain/cast-member.aggregate';
import { SaveCastMemberInput } from '../save-cast-member.input';
import { CastMemberElasticSearchRepository } from '../../../../infra/db/elastic-search/cast-member-elastic-search';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import {
  CastMemberType,
  CastMemberTypes,
} from '../../../../domain/cast-member-type.vo';

describe('SaveCastMemberUseCase Integration Tests', () => {
  let useCase: SaveCastMemberUseCase;
  let repository: CastMemberElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CastMemberElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new SaveCastMemberUseCase(repository);
  });

  it('should create a cast member', async () => {
    const uuid = '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e';
    const created_at = new Date();
    const output = await useCase.execute(
      new SaveCastMemberInput({
        cast_member_id: uuid,
        name: 'test',
        type: CastMemberTypes.ACTOR,
        created_at: created_at,
      }),
    );
    const entity = await repository.findById(new CastMemberId(uuid));
    expect(output).toStrictEqual({
      id: uuid,
      created: true,
    });
    expect(entity).toMatchObject({
      name: 'test',
      type: CastMemberType.createAnActor(),
      created_at,
    });
  });

  it('should update a cast member', async () => {
    const uuid = '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e';
    const created_at = new Date();
    const castMember = CastMember.fake().anActor().build();
    await repository.insert(castMember);
    const output = await useCase.execute(
      new SaveCastMemberInput({
        cast_member_id: uuid,
        name: 'test',
        type: CastMemberTypes.DIRECTOR,
        created_at: created_at,
      }),
    );
    expect(output).toStrictEqual({
      id: uuid,
      created: true,
    });
    const entity = await repository.findById(new CastMemberId(uuid));
    expect(entity).toMatchObject({
      name: 'test',
      type: CastMemberType.createADirector(),
      created_at,
    });
  });
});
