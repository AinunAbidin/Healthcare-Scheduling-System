import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { ILoggerService } from 'src/infra';

@Catch()
export class GraphqlExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: ILoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): never {
    if (host.getType<GqlContextType>() !== 'graphql') {
      throw exception;
    }

    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo<{ fieldName?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = this.mapHttpStatusToErrorCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.loggerService.error(
      `[GraphQL Exception] field=${info.fieldName ?? 'unknown'} status=${status} message=${message}`,
    );

    throw new GraphQLError(message, {
      extensions: {
        code: errorCode,
        statusCode: status,
      },
    });
  }

  private mapHttpStatusToErrorCode(status: number): string {
    if (status >= 400 && status < 500) {
      return 'BAD_REQUEST';
    }

    return 'INTERNAL_SERVER_ERROR';
  }
}
