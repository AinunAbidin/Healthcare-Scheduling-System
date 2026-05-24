jest.mock('src/common', () => ({
  hashValue: jest.fn(),
  compareHash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

import { compareHash, hashValue } from 'src/common';
import { AUTH_ERROR_MESSAGES, AUTH_TOKEN_TYPE } from 'src/modules/auth/constants';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { sign, verify } from 'jsonwebtoken';
import {
  createMockAuthDatabaseService,
  createMockLoggerService,
} from '../setup/test-utils';

describe('AuthService', () => {
  const mockedHashValue = hashValue as jest.MockedFunction<typeof hashValue>;
  const mockedCompareHash = compareHash as jest.MockedFunction<typeof compareHash>;
  const mockedSign = sign as unknown as jest.Mock;
  const mockedVerify = verify as unknown as jest.Mock;

  const databaseService = createMockAuthDatabaseService();
  const loggerService = createMockLoggerService();
  const service = new AuthService(databaseService, loggerService);

  const userRecord = {
    id: 'user-1',
    email: 'user@example.com',
    password: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register creates user with hashed password', async () => {
    databaseService.findUserByEmail.mockResolvedValue(null);
    mockedHashValue.mockResolvedValue('hashed-password');
    databaseService.createUser.mockResolvedValue(userRecord);

    const result = await service.register({
      email: 'USER@EXAMPLE.COM',
      password: 'password123',
    });

    expect(databaseService.findUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockedHashValue).toHaveBeenCalledWith('password123');
    expect(databaseService.createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'hashed-password',
    });
    expect(result).toEqual({
      id: userRecord.id,
      email: userRecord.email,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it('register rejects duplicate email', async () => {
    databaseService.findUserByEmail.mockResolvedValue(userRecord);

    await expect(
      service.register({
        email: userRecord.email,
        password: 'password123',
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGES.emailAlreadyRegistered);

    expect(mockedHashValue).not.toHaveBeenCalled();
    expect(databaseService.createUser).not.toHaveBeenCalled();
  });

  it('login returns access token for valid credentials', async () => {
    databaseService.findUserByEmail.mockResolvedValue(userRecord);
    mockedCompareHash.mockResolvedValue(true);
    mockedSign.mockReturnValue('signed-token');

    const result = await service.login({
      email: userRecord.email,
      password: 'password123',
    });

    expect(databaseService.findUserByEmail).toHaveBeenCalledWith(userRecord.email);
    expect(mockedCompareHash).toHaveBeenCalledWith('password123', userRecord.password);
    expect(mockedSign).toHaveBeenCalled();
    expect(result.accessToken).toBe('signed-token');
    expect(result.tokenType).toBe(AUTH_TOKEN_TYPE);
    expect(result.user.id).toBe(userRecord.id);
    expect(result.user.email).toBe(userRecord.email);
    expect((result.user as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it('login rejects invalid email', async () => {
    databaseService.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGES.invalidCredentials);

    expect(mockedCompareHash).not.toHaveBeenCalled();
    expect(mockedSign).not.toHaveBeenCalled();
  });

  it('login rejects invalid password', async () => {
    databaseService.findUserByEmail.mockResolvedValue(userRecord);
    mockedCompareHash.mockResolvedValue(false);

    await expect(
      service.login({
        email: userRecord.email,
        password: 'wrong-password',
      }),
    ).rejects.toThrow(AUTH_ERROR_MESSAGES.invalidCredentials);

    expect(mockedSign).not.toHaveBeenCalled();
  });

  it('validateToken returns user info for valid token', async () => {
    mockedVerify.mockReturnValue({
      sub: userRecord.id,
      email: userRecord.email,
    });
    databaseService.findUserById.mockResolvedValue(userRecord);

    const result = await service.validateToken('valid-token');

    expect(mockedVerify).toHaveBeenCalledWith(
      'valid-token',
      expect.any(String),
    );
    expect(databaseService.findUserById).toHaveBeenCalledWith(userRecord.id);
    expect(result).toEqual({
      id: userRecord.id,
      email: userRecord.email,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
    expect((result as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it('validateToken rejects invalid token', async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(service.validateToken('invalid-token')).rejects.toThrow(
      AUTH_ERROR_MESSAGES.invalidToken,
    );

    expect(databaseService.findUserById).not.toHaveBeenCalled();
  });
});
