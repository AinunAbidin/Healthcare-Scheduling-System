import { scheduleServiceEnv } from './env.validation';

export const QueueConfig = {
  redisHost: scheduleServiceEnv.REDIS_HOST,
  redisPort: scheduleServiceEnv.REDIS_PORT,
  redisPassword: scheduleServiceEnv.REDIS_PASSWORD,
} as const;
