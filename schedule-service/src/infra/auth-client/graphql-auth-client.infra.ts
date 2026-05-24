import { Injectable } from '@nestjs/common';
import { AuthServiceConfig } from 'src/config';
import { ILoggerService } from '../logger/logger.interface';
import { AuthenticatedUser, IAuthClientService } from './auth-client.interface';

interface GraphqlError {
  message: string;
}

interface ValidateTokenResult {
  id: string;
  email: string;
}

interface ValidateTokenData {
  validateToken: ValidateTokenResult | null;
}

interface GraphqlResponse<TData> {
  data?: TData;
  errors?: GraphqlError[];
}

const VALIDATE_TOKEN_QUERY = `
  query ValidateToken($token: String!) {
    validateToken(token: $token) {
      id
      email
    }
  }
`;

@Injectable()
export class GraphqlAuthClientInfra implements IAuthClientService {
  constructor(private readonly loggerService: ILoggerService) {}

  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    const authToken = token.trim();

    if (!authToken) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AuthServiceConfig.timeoutMs);

    try {
      const response = await fetch(AuthServiceConfig.graphqlUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          query: VALIDATE_TOKEN_QUERY,
          variables: { token: authToken },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.loggerService.warn(
          `Auth client validateToken failed: status=${response.status}`,
        );
        return null;
      }

      const payload = (await response.json()) as GraphqlResponse<ValidateTokenData>;

      if (payload.errors && payload.errors.length > 0) {
        this.loggerService.warn(
          `Auth client validateToken GraphQL errors: count=${payload.errors.length}`,
        );
        return null;
      }

      const validatedUser = payload.data?.validateToken;
      if (!validatedUser) {
        return null;
      }

      return {
        id: validatedUser.id,
        email: validatedUser.email,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown auth client error';
      this.loggerService.error(`Auth client validateToken exception: ${message}`);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
