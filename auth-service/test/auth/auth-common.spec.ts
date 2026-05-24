import {
  ArgumentsHost,
  BadRequestException,
  ExecutionContext,
} from '@nestjs/common';
import {
  GqlArgumentsHost,
  GqlExecutionContext,
} from '@nestjs/graphql';
import { firstValueFrom, of, throwError } from 'rxjs';
import { GraphqlExceptionFilter } from 'src/common/filters/graphql-exception.filter';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { createMockLoggerService } from '../setup/test-utils';

describe('Auth Common Components', () => {
  const loggerService = createMockLoggerService();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('GraphqlExceptionFilter rethrows non-graphql exception context', () => {
    const filter = new GraphqlExceptionFilter(loggerService);
    const exception = new Error('boom');
    const host = {
      getType: jest.fn().mockReturnValue('http'),
    } as unknown as ArgumentsHost;

    expect(() => filter.catch(exception, host)).toThrow(exception);
  });

  it('GraphqlExceptionFilter maps http exception to GraphQL error response', () => {
    const filter = new GraphqlExceptionFilter(loggerService);
    const host = {
      getType: jest.fn().mockReturnValue('graphql'),
    } as unknown as ArgumentsHost;

    jest.spyOn(GqlArgumentsHost, 'create').mockReturnValue({
      getInfo: () => ({ fieldName: 'register' }),
    } as unknown as GqlArgumentsHost);

    let thrownError: unknown;
    try {
      filter.catch(new BadRequestException('invalid payload'), host);
    } catch (error) {
      thrownError = error;
    }

    const graphqlError = thrownError as {
      message: string;
      extensions?: Record<string, unknown>;
    };
    expect(graphqlError.message).toContain('invalid payload');
    expect(graphqlError.extensions?.code).toBe('BAD_REQUEST');
    expect(graphqlError.extensions?.statusCode).toBe(400);
    expect(loggerService.error).toHaveBeenCalled();
  });

  it('GraphqlExceptionFilter maps generic error to internal server code', () => {
    const filter = new GraphqlExceptionFilter(loggerService);
    const host = {
      getType: jest.fn().mockReturnValue('graphql'),
    } as unknown as ArgumentsHost;

    jest.spyOn(GqlArgumentsHost, 'create').mockReturnValue({
      getInfo: () => ({ fieldName: 'login' }),
    } as unknown as GqlArgumentsHost);

    let thrownError: unknown;
    try {
      filter.catch(new Error('unexpected'), host);
    } catch (error) {
      thrownError = error;
    }

    const graphqlError = thrownError as {
      extensions?: Record<string, unknown>;
    };
    expect(graphqlError.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(graphqlError.extensions?.statusCode).toBe(500);
  });

  it('LoggingInterceptor logs successful GraphQL operations', async () => {
    const interceptor = new LoggingInterceptor(loggerService);
    const context = {} as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getInfo: () => ({
        parentType: { name: 'Query' },
        fieldName: 'validateToken',
      }),
    } as unknown as GqlExecutionContext);

    const next = {
      handle: () => of('ok'),
    };

    const result = await firstValueFrom(interceptor.intercept(context, next));

    expect(result).toBe('ok');
    expect(loggerService.log).toHaveBeenCalledWith(
      expect.stringContaining('operation=Query.validateToken'),
    );
  });

  it('LoggingInterceptor logs failed GraphQL operations', async () => {
    const interceptor = new LoggingInterceptor(loggerService);
    const context = {} as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getInfo: () => ({
        parentType: undefined,
        fieldName: undefined,
      }),
    } as unknown as GqlExecutionContext);

    const next = {
      handle: () => throwError(() => new Error('failed op')),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('failed op');

    expect(loggerService.error).toHaveBeenCalledWith(
      expect.stringContaining('operation=UnknownParent.unknownField'),
    );
  });
});
