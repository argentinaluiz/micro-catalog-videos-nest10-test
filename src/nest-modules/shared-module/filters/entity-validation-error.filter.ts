import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { EntityValidationError } from '../../../core/shared/domain/validators/validation.error';
import { GraphQLError } from 'graphql';
import { union } from 'lodash';

@Catch(EntityValidationError)
export class EntityValidationErrorFilter implements ExceptionFilter {
  catch(exception: EntityValidationError, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() !== 'graphql') {
      return null;
    }

    return new GraphQLError('Unprocessable Entity', {
      extensions: {
        errors: union(
          ...exception.error.reduce(
            (acc, error) =>
              acc.concat(
                //@ts-expect-error - error can be string
                typeof error === 'string'
                  ? [[error]]
                  : [
                      Object.values(error).reduce(
                        (acc, error) => acc.concat(error),
                        [] as string[],
                      ),
                    ],
              ),
            [] as string[],
          ),
        ),
      },
    });
  }
}
