type NodeEnv = 'development' | 'production' | 'test';

export interface AuthServiceEnv {
  NODE_ENV: NodeEnv;
  AUTH_SERVICE_PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GRAPHQL_PLAYGROUND: boolean;
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
  const value = getRequiredString('AUTH_SERVICE_PORT');
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      '[Config Validation] AUTH_SERVICE_PORT must be an integer between 1 and 65535',
    );
  }

  return parsed;
}

function parseDatabaseUrl(): string {
  const value = getRequiredString('DATABASE_URL');

  try {
    const url = new URL(value);

    if (
      url.protocol !== 'postgresql:' &&
      url.protocol !== 'postgres:'
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      '[Config Validation] DATABASE_URL must be a valid PostgreSQL URL',
    );
  }

  return value;
}

function parseJwtSecret(): string {
  const value = getRequiredString('JWT_SECRET');

  if (value.length < 16) {
    throw new Error('[Config Validation] JWT_SECRET must be at least 16 characters');
  }

  return value;
}

function parseJwtExpiresIn(): string {
  return getRequiredString('JWT_EXPIRES_IN');
}

function parseGraphqlPlayground(): boolean {
  const value = getRequiredString('GRAPHQL_PLAYGROUND').toLowerCase();

  if (value !== 'true' && value !== 'false') {
    throw new Error('[Config Validation] GRAPHQL_PLAYGROUND must be true or false');
  }

  return value === 'true';
}

export const authServiceEnv: AuthServiceEnv = {
  NODE_ENV: parseNodeEnv(),
  AUTH_SERVICE_PORT: parsePort(),
  DATABASE_URL: parseDatabaseUrl(),
  JWT_SECRET: parseJwtSecret(),
  JWT_EXPIRES_IN: parseJwtExpiresIn(),
  GRAPHQL_PLAYGROUND: parseGraphqlPlayground(),
};
