import { DeleteCastMemberUseCase } from '../delete-cast-member.use-case';
import { setupElasticSearch } from '../../../../../shared/infra/testing/helpers';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import {
  CastMember,
  CastMemberId,
} from '../../../../domain/cast-member.aggregate';
import { CastMemberElasticSearchRepository } from '../../../../infra/db/elastic-search/cast-member-elastic-search';

describe('DeleteCastMemberUseCase Integration Tests', () => {
  let useCase: DeleteCastMemberUseCase;
  let repository: CastMemberElasticSearchRepository;

  const esHelper = setupElasticSearch();

  beforeEach(() => {
    repository = new CastMemberElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new DeleteCastMemberUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const castMemberId = new CastMemberId();
    await expect(() => useCase.execute(castMemberId.id)).rejects.toThrow(
      new NotFoundError(castMemberId.id, CastMember),
    );
  });

  it('should delete a cast member', async () => {
    const castMember = CastMember.fake().aDirector().build();
    await repository.insert(castMember);
    await useCase.execute(castMember.cast_member_id.id);
    const noEntity = await repository
      .ignoreSoftDeleted()
      .findById(castMember.cast_member_id);
    expect(noEntity).toBeNull();
  });
});
