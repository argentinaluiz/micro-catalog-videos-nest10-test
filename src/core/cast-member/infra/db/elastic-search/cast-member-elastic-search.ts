import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  CastMemberSearchParams,
  CastMemberSearchResult,
  ICastMemberRepository,
} from '../../../domain/cast-member.repository';
import {
  CastMember,
  CastMemberId,
} from '../../../domain/cast-member.aggregate';
import {
  GetGetResult,
  QueryDslQueryContainer,
  SearchTotalHits,
} from '@elastic/elasticsearch/lib/api/types';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { CastMemberType } from '../../../domain/cast-member-type.vo';
import { LoadEntityError } from '../../../../shared/domain/validators/validation.error';

export const CAST_MEMBER_DOCUMENT_TYPE_NAME = 'CastMember';

export type CastMemberDocument = {
  cast_member_name: string;
  cast_member_type: number;
  created_at: Date | string;
  deleted_at: Date | string | null;
  type: typeof CAST_MEMBER_DOCUMENT_TYPE_NAME;
};

export class CastMemberElasticSearchMapper {
  static toEntity(id: string, document: CastMemberDocument): CastMember {
    if (document.type !== CAST_MEMBER_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    const [type, errorCastMemberType] = CastMemberType.create(
      document.cast_member_type as any,
    ).asArray();

    const castMember = new CastMember({
      cast_member_id: new CastMemberId(id),
      name: document.cast_member_name,
      type,
      created_at: !(document.created_at instanceof Date)
        ? new Date(document.created_at)
        : document.created_at,
      deleted_at:
        document.deleted_at === null
          ? null
          : !(document.deleted_at instanceof Date)
            ? new Date(document.deleted_at!)
            : document.deleted_at,
    });

    castMember.validate();

    const notification = castMember.notification;
    if (errorCastMemberType) {
      notification.setError(errorCastMemberType.message, 'type');
    }

    if (notification.hasErrors()) {
      throw new LoadEntityError(notification.toJSON());
    }

    return castMember;
  }

  static toDocument(entity: CastMember): CastMemberDocument {
    return {
      cast_member_name: entity.name,
      cast_member_type: entity.type.type,
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
    };
  }
}

export class CastMemberElasticSearchRepository
  implements ICastMemberRepository
{
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    name: 'cast_member_name',
    created_at: 'created_at',
  };

  async insert(entity: CastMember): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.cast_member_id.id,
      document: CastMemberElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: CastMember[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.cast_member_id.id } },
        CastMemberElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: CastMemberId): Promise<CastMember | null> {
    const result = await this.esClient.search({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              match: {
                _id: id.id,
              },
            },
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });

    const docs = result.hits.hits as GetGetResult<CastMemberDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source!;

    if (!document) {
      return null;
    }

    return CastMemberElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<CastMember[]> {
    const result = await this.esClient.search<CastMemberDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });
    return result.hits.hits.map((hit) =>
      CastMemberElasticSearchMapper.toEntity(hit._id, hit._source!),
    );
  }

  async findByIds(
    ids: CastMemberId[],
  ): Promise<{ exists: CastMember[]; not_exists: CastMemberId[] }> {
    const result = await this.esClient.search<CastMemberDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: ids.map((id) => id.id),
              },
            },
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
    });

    const docs = result.hits.hits as GetGetResult<CastMemberDocument>[];
    return {
      exists: docs.map((doc) =>
        CastMemberElasticSearchMapper.toEntity(doc._id, doc._source!),
      ),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.id)),
    };
  }

  async existsById(
    ids: CastMemberId[],
  ): Promise<{ exists: CastMemberId[]; not_exists: CastMemberId[] }> {
    const result = await this.esClient.search<CastMemberDocument>({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: ids.map((id) => id.id),
              },
            },
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
      _source: false,
    });

    const docs = result.hits.hits as GetGetResult<CastMemberDocument>[];
    const existsCastMemberIds = docs.map((m) => new CastMemberId(m._id));
    const notExistsCastMemberIds = ids.filter(
      (id) => !existsCastMemberIds.some((e) => e.equals(id)),
    );
    return {
      exists: existsCastMemberIds,
      not_exists: notExistsCastMemberIds,
    };
  }

  async update(entity: CastMember): Promise<void> {
    const response = await this.esClient.updateByQuery({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              ids: {
                values: entity.cast_member_id.id,
              },
            },
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
          must_not: [
            {
              exists: {
                field: 'deleted_at',
              },
            },
          ],
        },
      },
      script: {
        source: `
          ctx._source.cast_member_name = params.cast_member_name;
          ctx._source.cast_member_type = params.type;
          ctx._source.created_at = params.created_at;
          ctx._source.deleted_at = params.deleted_at;
        `,
        params: {
          cast_member_name: entity.name,
          type: entity.type.type,
          created_at: entity.created_at,
          deleted_at: entity.deleted_at,
        },
      },
      refresh: true,
    });

    if (response.total !== 1) {
      throw new NotFoundError(entity.cast_member_id.id, this.getEntity());
    }
  }

  async delete(id: CastMemberId): Promise<void> {
    const response = await this.esClient.deleteByQuery({
      index: this.index,
      query: {
        bool: {
          must: [
            {
              match: {
                _id: id.id,
              },
            },
            {
              match: {
                type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
              },
            },
          ],
        },
      },
      refresh: true,
    });
    if (response.deleted !== 1) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  async search(props: CastMemberSearchParams): Promise<CastMemberSearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CAST_MEMBER_DOCUMENT_TYPE_NAME,
            },
          },
        ],
        must_not: [
          {
            exists: {
              field: 'deleted_at',
            },
          },
        ],
      },
    };

    if (props.filter) {
      if (props.filter.name) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          wildcard: {
            cast_member_name: {
              value: `*${props.filter.name}*`,
              case_insensitive: true,
            },
          },
        });
      }

      if (props.filter.type) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          match: {
            cast_member_type: props.filter.type.type,
          },
        });
      }
    }

    const result = await this.esClient.search({
      index: this.index,
      from: offset,
      size: limit,
      sort:
        props.sort && this.sortableFieldsMap.hasOwnProperty(props.sort)
          ? { [this.sortableFieldsMap[props.sort]]: props.sort_dir! }
          : { created_at: 'desc' },
      query,
    });
    const docs = result.hits.hits as GetGetResult<CastMemberDocument>[];
    const entities = docs.map((doc) =>
      CastMemberElasticSearchMapper.toEntity(doc._id, doc._source!),
    );
    const total = result.hits.total as SearchTotalHits;
    return new CastMemberSearchResult({
      total: total.value,
      current_page: props.page,
      per_page: props.per_page,
      items: entities,
    });
  }

  getEntity(): new (...args: any[]) => CastMember {
    return CastMember;
  }
}
