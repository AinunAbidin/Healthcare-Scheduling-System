import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface AuthContextUser {
  id: string;
  email: string;
}

interface RequestLike {
  user?: AuthContextUser;
}

interface GraphqlContextLike {
  req?: RequestLike;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContextUser | null => {
    const gqlContext = GqlExecutionContext.create(context);
    const graphContext = gqlContext.getContext<GraphqlContextLike>();
    return graphContext.req?.user ?? null;
  },
);
