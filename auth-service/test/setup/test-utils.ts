import { IDatabaseService, ILoggerService } from 'src/infra';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.AUTH_SERVICE_PORT = process.env.AUTH_SERVICE_PORT ?? '3001';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/healthcare?schema=auth';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'change-this-secret-with-at-least-16-characters';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.GRAPHQL_PLAYGROUND = process.env.GRAPHQL_PLAYGROUND ?? 'false';

export function createMockAuthDatabaseService(): jest.Mocked<IDatabaseService> {
  return {
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
  };
}

export function createMockLoggerService(): jest.Mocked<ILoggerService> {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
