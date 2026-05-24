import {
  IAuthClientService,
  ICacheService,
  IDatabaseService,
  ILoggerService,
  IQueueService,
} from 'src/infra';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.SCHEDULE_SERVICE_PORT = process.env.SCHEDULE_SERVICE_PORT ?? '3002';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/healthcare?schema=schedule';
process.env.AUTH_SERVICE_GRAPHQL_URL =
  process.env.AUTH_SERVICE_GRAPHQL_URL ?? 'http://localhost:3001/graphql';
process.env.AUTH_SERVICE_TIMEOUT_MS = process.env.AUTH_SERVICE_TIMEOUT_MS ?? '5000';
process.env.GRAPHQL_PLAYGROUND = process.env.GRAPHQL_PLAYGROUND ?? 'false';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? '';
process.env.CACHE_ENABLED = process.env.CACHE_ENABLED ?? 'true';
process.env.CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS ?? '60';
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? 'no-reply@healthcare.local';
process.env.SMTP_HOST = process.env.SMTP_HOST ?? 'localhost';
process.env.SMTP_PORT = process.env.SMTP_PORT ?? '2525';
process.env.SMTP_USER = process.env.SMTP_USER ?? 'user';
process.env.SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? 'password';

export function createMockScheduleDatabaseService(): jest.Mocked<IDatabaseService> {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    findCustomers: jest.fn(),
    countCustomers: jest.fn(),
    findCustomerById: jest.fn(),
    findCustomerByEmail: jest.fn(),
    deleteCustomer: jest.fn(),
    createDoctor: jest.fn(),
    updateDoctor: jest.fn(),
    findDoctors: jest.fn(),
    countDoctors: jest.fn(),
    findDoctorById: jest.fn(),
    deleteDoctor: jest.fn(),
    createSchedule: jest.fn(),
    findSchedules: jest.fn(),
    countSchedules: jest.fn(),
    findScheduleById: jest.fn(),
    findScheduleByDoctorAndScheduledAt: jest.fn(),
    updateSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
  };
}

export function createMockLoggerService(): jest.Mocked<ILoggerService> {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

export function createMockQueueService(): jest.Mocked<IQueueService> {
  return {
    enqueue: jest.fn(),
    registerProcessor: jest.fn(),
  };
}

export function createMockCacheService(): jest.Mocked<ICacheService> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPattern: jest.fn(),
  };
}

export function createMockAuthClientService(): jest.Mocked<IAuthClientService> {
  return {
    validateToken: jest.fn(),
  };
}
