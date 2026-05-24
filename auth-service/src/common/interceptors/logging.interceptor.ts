import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';
import { ILoggerService } from 'src/infra';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: ILoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = Date.now();
    const operationName = this.resolveOperationName(context);

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startTime;
          this.loggerService.log(
            `[GraphQL] operation=${operationName} durationMs=${elapsed}`,
          );
        },
        error: (error: unknown) => {
          const elapsed = Date.now() - startTime;
          const message =
            error instanceof Error ? error.message : 'Unknown error';

          this.loggerService.error(
            `[GraphQL] operation=${operationName} durationMs=${elapsed} error=${message}`,
          );
        },
      }),
    );
  }

  private resolveOperationName(context: ExecutionContext): string {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo<{ parentType?: { name?: string }; fieldName?: string }>();
    const parentName = info.parentType?.name ?? 'UnknownParent';
    const fieldName = info.fieldName ?? 'unknownField';
    return `${parentName}.${fieldName}`;
  }
}
