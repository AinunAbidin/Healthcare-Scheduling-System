import { scheduleServiceEnv } from './env.validation';

export const CacheConfig = {
  enabled: scheduleServiceEnv.CACHE_ENABLED,
  ttlSeconds: scheduleServiceEnv.CACHE_TTL_SECONDS,
  redisHost: scheduleServiceEnv.REDIS_HOST,
  redisPort: scheduleServiceEnv.REDIS_PORT,
  redisPassword: scheduleServiceEnv.REDIS_PASSWORD,
} as const;
