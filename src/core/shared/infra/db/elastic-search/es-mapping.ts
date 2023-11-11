import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const esMapping: MappingTypeMapping = {
  properties: {
    type: { type: 'keyword' },
    category_name: { type: 'keyword' },
    description: { type: 'text' },
    is_active: { type: 'boolean' },
    created_at: { type: 'date' },
  },
};
