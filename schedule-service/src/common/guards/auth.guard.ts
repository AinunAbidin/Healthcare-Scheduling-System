import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser, IAuthClientService } from 'src/infra';

interface GraphqlRequestLike {
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

interface GraphqlContextLike {
  req?: GraphqlRequestLike;
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authClientService: IAuthClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const contextValue = gqlContext.getContext<GraphqlContextLike>();
    const token = this.extractBearerToken(contextValue);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const user = await this.authClientService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    this.attachAuthenticatedUser(contextValue, user);
    return true;
  }

  private extractBearerToken(contextValue: GraphqlContextLike): string | null {
    const headerValue =
      this.findHeaderValue(contextValue.req?.headers, 'authorization') ??
      this.findHeaderValue(contextValue.headers, 'authorization');

    if (!headerValue) {
      return null;
    }

    const [scheme, token] = headerValue.split(' ');
    if (scheme !== 'Bearer' || !token || token.trim() === '') {
      return null;
    }

    return token.trim();
  }

  private findHeaderValue(
    headers: Record<string, string | string[] | undefined> | undefined,
    name: string,
  ): string | null {
    if (!headers) {
      return null;
    }

    const headerKey = Object.keys(headers).find(
      (key) => key.toLowerCase() === name.toLowerCase(),
    );

    if (!headerKey) {
      return null;
    }

    const value = headers[headerKey];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }

  private attachAuthenticatedUser(
    contextValue: GraphqlContextLike,
    user: AuthenticatedUser,
  ): void {
    if (contextValue.req) {
      contextValue.req.user = user;
      return;
    }

    contextValue.user = user;
  }
}
