import {
  CastMemberType,
  CastMemberTypes,
} from '../../../../domain/cast-member-type.vo';
import {
  CastMember,
  CastMemberId,
} from '../../../../domain/cast-member.aggregate';
import {
  CAST_MEMBER_DOCUMENT_TYPE_NAME,
  CastMemberDocument,
  CastMemberElasticSearchMapper,
} from '../cast-member-elastic-search';

describe('CastMemberElasticSearchMapper', () => {
  let castMemberDocument: CastMemberDocument;
  let castMember: CastMember;

  beforeEach(() => {
    castMemberDocument = {
      cast_member_name: 'Test',
      cast_member_type: CastMemberTypes.ACTOR,
      created_at: new Date(),
      deleted_at: null,
      type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
    };
    const id = new CastMemberId();

    castMember = new CastMember({
      cast_member_id: id,
      name: castMemberDocument.cast_member_name,
      type: CastMemberType.create(castMemberDocument.cast_member_type).ok,
      created_at: castMemberDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = CastMemberElasticSearchMapper.toEntity(
        castMember.cast_member_id.id,
        castMemberDocument,
      );
      expect(result).toEqual(castMember);

      castMemberDocument.deleted_at = new Date();
      castMember.deleted_at = castMemberDocument.deleted_at;

      const result2 = CastMemberElasticSearchMapper.toEntity(
        castMember.cast_member_id.id,
        castMemberDocument,
      );
      expect(result2).toEqual(castMember);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = CastMemberElasticSearchMapper.toDocument(castMember);
      expect(result).toEqual(castMemberDocument);

      castMember.deleted_at = new Date();
      castMemberDocument.deleted_at = castMember.deleted_at;

      const result2 = CastMemberElasticSearchMapper.toDocument(castMember);
      expect(result2).toEqual(castMemberDocument);
    });
  });
});
