import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const esMapping: MappingTypeMapping = {
  properties: {
    type: { type: 'keyword' },
    category_name: { type: 'keyword' },
    genre_name: { type: 'keyword' },
    cast_member_name: { type: 'keyword' },
    video_title: { type: 'text', analyzer: 'ngram_analyzer' },
    video_title_keyword: { type: 'keyword' },
    video_description: { type: 'text', analyzer: 'ngram_analyzer' },
    year_launched: { type: 'integer' },
    duration: { type: 'integer' },
    rating: { type: 'keyword' },
    is_opened: { type: 'boolean' },
    is_published: { type: 'boolean' },
    banner_url: { type: 'keyword' },
    thumbnail_url: { type: 'keyword' },
    thumbnail_half_url: { type: 'keyword' },
    trailer_url: { type: 'keyword' },
    video_url: { type: 'keyword' },
    description: { type: 'text' },
    is_active: { type: 'boolean' },
    cast_member_type: { type: 'integer' },
    created_at: { type: 'date' },
    deleted_at: { type: 'date' },
    categories: {
      type: 'nested',
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
        is_active: { type: 'boolean' },
        deleted_at: { type: 'date' },
      },
    },
    genres: {
      type: 'nested',
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
        is_active: { type: 'boolean' },
        deleted_at: { type: 'date' },
      },
    },
    cast_members: {
      type: 'nested',
      properties: {
        id: { type: 'keyword' },
        name: { type: 'text' },
        cast_member_type: { type: 'integer' },
        deleted_at: { type: 'date' },
      },
    },
  },
};

//keyword vs test
//illegal_argument_exception: Text fields are not optimised for operations that require per-document field data like aggregations and sorting, so these operations are disabled by default. Please use a keyword field instead. Alternatively, set fielddata=true on [category_name] in order to load field data by uninverting the inverted index. Note that this can use significant memory.
