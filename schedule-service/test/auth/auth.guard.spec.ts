import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from 'src/common';
import { createMockAuthClientService } from '../setup/test-utils';

describe('AuthGuard', () => {
  const authClientService = createMockAuthClientService();
  const guard = new AuthGuard(authClientService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockGraphqlContext(contextValue: unknown): void {
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({
        getContext: () => contextValue,
      } as unknown as GqlExecutionContext);
  }

  it('allows valid Bearer token', async () => {
    const contextValue = {
      req: {
        headers: {
          authorization: 'Bearer valid-token',
        },
      },
    };
    mockGraphqlContext(contextValue);
    authClientService.validateToken.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    await expect(
      guard.canActivate({} as ExecutionContext),
    ).resolves.toBe(true);
    expect(authClientService.validateToken).toHaveBeenCalledWith('valid-token');
  });

  it('rejects missing Authorization header', async () => {
    mockGraphqlContext({
      req: {
        headers: {},
      },
    });

    await expect(guard.canActivate({} as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Missing or invalid Authorization header'),
    );
  });

  it('rejects invalid Authorization format', async () => {
    mockGraphqlContext({
      req: {
        headers: {
          authorization: 'Token abc',
        },
      },
    });

    await expect(guard.canActivate({} as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Missing or invalid Authorization header'),
    );
  });

  it('rejects invalid token', async () => {
    mockGraphqlContext({
      req: {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      },
    });
    authClientService.validateToken.mockResolvedValue(null);

    await expect(guard.canActivate({} as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired token'),
    );
  });

  it('attaches user info to GraphQL context if implemented', async () => {
    const contextValue: {
      req?: {
        headers?: Record<string, string>;
        user?: { id: string; email: string };
      };
      headers?: Record<string, string>;
      user?: { id: string; email: string };
    } = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    mockGraphqlContext(contextValue);
    authClientService.validateToken.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    const result = await guard.canActivate({} as ExecutionContext);

    expect(result).toBe(true);
    expect(contextValue.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
  });
});
