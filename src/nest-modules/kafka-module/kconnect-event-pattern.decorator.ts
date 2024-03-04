import { SetMetadata } from '@nestjs/common';

export const K_CONNECT_TOPIC_METADATA = '__k_connect_topic__';

export function KConnectEventPattern(variable: string): any {
  return SetMetadata(K_CONNECT_TOPIC_METADATA, variable);
}
