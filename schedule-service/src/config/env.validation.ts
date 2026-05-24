type NodeEnv = 'development' | 'production' | 'test';

export interface ScheduleServiceEnv {
  NODE_ENV: NodeEnv;
  SCHEDULE_SERVICE_PORT: number;
  DATABASE_URL: string;
  AUTH_SERVICE_GRAPHQL_URL: string;
  AUTH_SERVICE_TIMEOUT_MS: number;
  GRAPHQL_PLAYGROUND: boolean;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  CACHE_ENABLED: boolean;
  CACHE_TTL_SECONDS: number;
  EMAIL_FROM: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
}

const ALLOWED_NODE_ENVS: readonly NodeEnv[] = [
  'development',
  'production',
  'test',
];

function getRequiredString(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(`[Config Validation] Missing required env: ${name}`);
  }

  return value.trim();
}

function parseNodeEnv(): NodeEnv {
  const value = getRequiredString('NODE_ENV');

  if (
    value !== ALLOWED_NODE_ENVS[0] &&
    value !== ALLOWED_NODE_ENVS[1] &&
    value !== ALLOWED_NODE_ENVS[2]
  ) {
    throw new Error(
      `[Config Validation] NODE_ENV must be one of: ${ALLOWED_NODE_ENVS.join(', ')}`,
    );
  }

  return value;
}

function parsePort(): number {
  const value = getRequiredString('SCHEDULE_SERVICE_PORT');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      '[Config Validation] SCHEDULE_SERVICE_PORT must be an integer between 1 and 65535',
    );
  }

  return parsed;
}

function parseDatabaseUrl(): string {
  const value = getRequiredString('DATABASE_URL');

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      throw new Error();
    }
  } catch {
    throw new Error('[Config Validation] DATABASE_URL must be a valid PostgreSQL URL');
  }

  return value;
}

function parseAuthServiceGraphqlUrl(): string {
  const value = getRequiredString('AUTH_SERVICE_GRAPHQL_URL');

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error();
    }
  } catch {
    throw new Error(
      '[Config Validation] AUTH_SERVICE_GRAPHQL_URL must be a valid HTTP(S) URL',
    );
  }

  return value;
}

function parseAuthServiceTimeoutMs(): number {
  const value = getRequiredString('AUTH_SERVICE_TIMEOUT_MS');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 100 || parsed > 60000) {
    throw new Error(
      '[Config Validation] AUTH_SERVICE_TIMEOUT_MS must be an integer between 100 and 60000',
    );
  }

  return parsed;
}

function parseGraphqlPlayground(): boolean {
  const value = getRequiredString('GRAPHQL_PLAYGROUND').toLowerCase();

  if (value !== 'true' && value !== 'false') {
    throw new Error('[Config Validation] GRAPHQL_PLAYGROUND must be true or false');
  }

  return value === 'true';
}

function parseRedisHost(): string {
  return getRequiredString('REDIS_HOST');
}

function parseRedisPort(): number {
  const value = getRequiredString('REDIS_PORT');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('[Config Validation] REDIS_PORT must be an integer between 1 and 65535');
  }

  return parsed;
}

function parseOptionalString(name: string): string | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseCacheEnabled(): boolean {
  const value = getRequiredString('CACHE_ENABLED').toLowerCase();

  if (value !== 'true' && value !== 'false') {
    throw new Error('[Config Validation] CACHE_ENABLED must be true or false');
  }

  return value === 'true';
}

function parseCacheTtlSeconds(): number {
  const value = getRequiredString('CACHE_TTL_SECONDS');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error('[Config Validation] CACHE_TTL_SECONDS must be an integer greater than 0');
  }

  return parsed;
}

function parseEmailFrom(): string {
  const value = getRequiredString('EMAIL_FROM');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error('[Config Validation] EMAIL_FROM must be a valid email address');
  }

  return value;
}

function parseSmtpHost(): string {
  return getRequiredString('SMTP_HOST');
}

function parseSmtpPort(): number {
  const value = getRequiredString('SMTP_PORT');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('[Config Validation] SMTP_PORT must be an integer between 1 and 65535');
  }

  return parsed;
}

function parseSmtpUser(): string {
  return getRequiredString('SMTP_USER');
}

function parseSmtpPassword(): string {
  return getRequiredString('SMTP_PASSWORD');
}

export const scheduleServiceEnv: ScheduleServiceEnv = {
  NODE_ENV: parseNodeEnv(),
  SCHEDULE_SERVICE_PORT: parsePort(),
  DATABASE_URL: parseDatabaseUrl(),
  AUTH_SERVICE_GRAPHQL_URL: parseAuthServiceGraphqlUrl(),
  AUTH_SERVICE_TIMEOUT_MS: parseAuthServiceTimeoutMs(),
  GRAPHQL_PLAYGROUND: parseGraphqlPlayground(),
  REDIS_HOST: parseRedisHost(),
  REDIS_PORT: parseRedisPort(),
  REDIS_PASSWORD: parseOptionalString('REDIS_PASSWORD'),
  CACHE_ENABLED: parseCacheEnabled(),
  CACHE_TTL_SECONDS: parseCacheTtlSeconds(),
  EMAIL_FROM: parseEmailFrom(),
  SMTP_HOST: parseSmtpHost(),
  SMTP_PORT: parseSmtpPort(),
  SMTP_USER: parseSmtpUser(),
  SMTP_PASSWORD: parseSmtpPassword(),
};
