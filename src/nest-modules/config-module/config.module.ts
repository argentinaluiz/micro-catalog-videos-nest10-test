import { DynamicModule, Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigModuleOptions,
} from '@nestjs/config';
import { join } from 'path';
import * as Joi from 'joi';

//@ts-expect-error - VALID
const joiJson = Joi.extend((joi) => {
  return {
    type: 'object',
    base: joi.object(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    coerce(value, _schema) {
      if (value[0] !== '{' && !/^\s*\{/.test(value)) {
        return;
      }

      try {
        return { value: JSON.parse(value) };
      } catch (err) {
        console.log(err);
      }
    },
  };
});

type ELASTIC_SEARCH_SCHEMA_TYPE = {
  ELASTIC_SEARCH_HOST: string;
  ELASTIC_SEARCH_INDEX: string;
};

export const CONFIG_ELASTIC_SEARCH_SCHEMA: Joi.StrictSchemaMap<ELASTIC_SEARCH_SCHEMA_TYPE> =
  {
    ELASTIC_SEARCH_HOST: Joi.string().required(),
    ELASTIC_SEARCH_INDEX: Joi.string().required(),
  };

type CONFIG_GOOGLE_SCHEMA_TYPE = {
  GOOGLE_CLOUD_CREDENTIALS: object;
  GOOGLE_CLOUD_STORAGE_BUCKET_NAME: string;
};

export const CONFIG_GOOGLE_SCHEMA: Joi.StrictSchemaMap<CONFIG_GOOGLE_SCHEMA_TYPE> =
  {
    GOOGLE_CLOUD_STORAGE_BUCKET_NAME: Joi.string().required(),
    GOOGLE_CLOUD_CREDENTIALS: joiJson.object().required(),
  };

export type CONFIG_SCHEMA_TYPE = ELASTIC_SEARCH_SCHEMA_TYPE &
  CONFIG_GOOGLE_SCHEMA_TYPE;

type CONFIG_AUTH_SCHEMA_TYPE = {
  JWT_PUBLIC_KEY: string;
  JWT_PRIVATE_KEY: string;
};

export const CONFIG_AUTH_SCHEMA: Joi.StrictSchemaMap<CONFIG_AUTH_SCHEMA_TYPE> =
  {
    JWT_PUBLIC_KEY: Joi.string().required(),
    JWT_PRIVATE_KEY: Joi.string().optional(),
  };

@Module({})
export class ConfigModule extends NestConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    const { envFilePath, ...otherOptions } = options;

    return super.forRoot({
      isGlobal: true,
      envFilePath: [
        ...(Array.isArray(envFilePath) ? envFilePath! : [envFilePath!]),
        join(__dirname, `../../../envs/.env.${process.env.NODE_ENV}`),
        join(__dirname, '../../../envs/.env'),
        // join(process.cwd(), `/envs/.env.${process.env.NODE_ENV}`),
        // join(process.cwd(), '/envs/.env'),
      ],
      validationSchema: joiJson.object({
        ...CONFIG_ELASTIC_SEARCH_SCHEMA,
        ...CONFIG_GOOGLE_SCHEMA,
        ...CONFIG_AUTH_SCHEMA,
      }),
      ...otherOptions,
    });
  }
}
