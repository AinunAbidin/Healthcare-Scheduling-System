import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser } from 'src/infra';

interface GraphqlRequestLike {
  user?: AuthenticatedUser;
}

interface GraphqlContextLike {
  req?: GraphqlRequestLike;
  user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | null => {
    const gqlContext = GqlExecutionContext.create(context);
    const contextValue = gqlContext.getContext<GraphqlContextLike>();

    return contextValue.req?.user ?? contextValue.user ?? null;
  },
);
