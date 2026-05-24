import { AuthResolver } from 'src/modules/auth/resolvers/auth.resolver';

describe('AuthResolver', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    validateToken: jest.fn(),
  };

  const resolver = new AuthResolver(authService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolver delegates register to AuthService', async () => {
    const output = {
      id: 'user-1',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    authService.register.mockResolvedValue(output);

    const result = await resolver.register({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(authService.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result).toEqual(output);
  });

  it('resolver delegates login to AuthService', async () => {
    const output = {
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: '1h',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    };

    authService.login.mockResolvedValue(output);

    const result = await resolver.login({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result).toEqual(output);
  });

  it('resolver delegates validateToken to AuthService', async () => {
    const output = {
      id: 'user-1',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    authService.validateToken.mockResolvedValue(output);

    const result = await resolver.validateToken('token');

    expect(authService.validateToken).toHaveBeenCalledWith('token');
    expect(result).toEqual(output);
  });

  it('resolver does not expose password', async () => {
    authService.register.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await resolver.register({
      email: 'user@example.com',
      password: 'password123',
    });

    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
  });
});
