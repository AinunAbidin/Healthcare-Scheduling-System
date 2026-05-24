import { scheduleServiceEnv } from './env.validation';

export const DatabaseConfig = {
  url: scheduleServiceEnv.DATABASE_URL,
} as const;
