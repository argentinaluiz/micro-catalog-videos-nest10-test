import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { KafkaParser, KafkaParserConfig } from '@nestjs/microservices';
import { isNil } from '@nestjs/common/utils/shared.utils';

export class SchemaRegistryParser extends KafkaParser {
  constructor(
    readonly schemaRegistry: SchemaRegistry,
    config?: KafkaParserConfig,
  ) {
    super(config);
  }

  public parse<T = any>(data: any): T {
    // Clone object to as modifying the original one would break KafkaJS retries
    const result = {
      ...data,
      headers: { ...data.headers },
    };

    if (!this.keepBinary) {
      result.value = this.decode(data.value);
    }

    if (!isNil(data.key)) {
      result.key = super.decode(data.key);
    }
    if (!isNil(data.headers)) {
      const decodeHeaderByKey = (key: string) => {
        result.headers[key] = this.decode(data.headers[key]);
      };
      Object.keys(data.headers).forEach(decodeHeaderByKey);
    } else {
      result.headers = {};
    }
    return result;
  }

  async decode(value: Buffer): Promise<any> {
    try {
      return await this.schemaRegistry.decode(value);
    } catch (e) {
      console.log(value.toString());
      if (e.message.includes('Message encoded with magic byte')) {
        return super.decode(value);
      }
      throw e;
    }
  }
}
