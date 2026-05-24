import { authServiceEnv } from './env.validation';

export const DatabaseConfig = {
  url: authServiceEnv.DATABASE_URL,
} as const;
