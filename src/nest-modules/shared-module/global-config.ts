import { INestApplication } from '@nestjs/common';
import { EntityValidationErrorFilter } from './filters/entity-validation-error.filter';

export function applyGlobalConfig(app: INestApplication) {
  app.useGlobalFilters(new EntityValidationErrorFilter());
}
