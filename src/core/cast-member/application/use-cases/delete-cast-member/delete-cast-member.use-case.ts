import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import {
  CastMember,
  CastMemberId,
} from '../../../domain/cast-member.aggregate';
import { ICastMemberRepository } from '../../../domain/cast-member.repository';

export class DeleteCastMemberUseCase implements IUseCase<string, void> {
  constructor(private castMemberRepository: ICastMemberRepository) {}

  async execute(id: string): Promise<void> {
    const castMember = await this.castMemberRepository.findById(
      new CastMemberId(id),
    );

    if (!castMember) {
      throw new NotFoundError(id, CastMember);
    }

    castMember.markAsDeleted();

    await this.castMemberRepository.update(castMember);
  }
}
