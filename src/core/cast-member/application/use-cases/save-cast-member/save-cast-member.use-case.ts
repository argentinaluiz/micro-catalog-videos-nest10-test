import { IUseCase } from '../../../../shared/application/use-case-interface';
import { ICastMemberRepository } from '../../../domain/cast-member.repository';
import {
  CastMember,
  CastMemberId,
} from '../../../domain/cast-member.aggregate';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { SaveCastMemberInput } from './save-cast-member.input';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { CastMemberType } from '../../../domain/cast-member-type.vo';

export class SaveCastMemberUseCase
  implements IUseCase<SaveCastMemberInput, SaveCastMemberOutput>
{
  constructor(private castMemberRepo: ICastMemberRepository) {}

  async execute(input: SaveCastMemberInput): Promise<SaveCastMemberOutput> {
    const castMemberId = new CastMemberId(input.cast_member_id);
    const castMember = await this.castMemberRepo.findById(castMemberId);

    return castMember
      ? this.updateCastMember(input, castMember)
      : this.createCastMember(input);
  }

  private async createCastMember(input: SaveCastMemberInput) {
    const [type, errorCastMemberType] = CastMemberType.create(
      input.type,
    ).asArray();

    if (errorCastMemberType) {
      throw new EntityValidationError([
        { type: [errorCastMemberType.message] },
      ]);
    }

    const entity = CastMember.create({
      ...input,
      cast_member_id: new CastMemberId(input.cast_member_id),
      type,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.castMemberRepo.insert(entity);

    return { id: entity.cast_member_id.id, created: true };
  }

  private async updateCastMember(
    input: SaveCastMemberInput,
    castMember: CastMember,
  ) {
    if (!castMember) {
      throw new NotFoundError(input.cast_member_id, CastMember);
    }

    const [type, errorCastMemberType] = CastMemberType.create(
      input.type,
    ).asArray();

    if (errorCastMemberType) {
      throw new EntityValidationError([
        { type: [errorCastMemberType.message] },
      ]);
    }

    castMember.changeName(input.name);

    castMember.changeType(type);

    castMember.changeCreatedAt(input.created_at);

    if (castMember.notification.hasErrors()) {
      throw new EntityValidationError(castMember.notification.toJSON());
    }

    await this.castMemberRepo.update(castMember);

    return { id: castMember.cast_member_id.id, created: false };
  }
}

export type SaveCastMemberOutput = { id: string; created: boolean };
