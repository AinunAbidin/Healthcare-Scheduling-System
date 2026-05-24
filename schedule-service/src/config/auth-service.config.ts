import { scheduleServiceEnv } from './env.validation';

export const AuthServiceConfig = {
  graphqlUrl: scheduleServiceEnv.AUTH_SERVICE_GRAPHQL_URL,
  timeoutMs: scheduleServiceEnv.AUTH_SERVICE_TIMEOUT_MS,
} as const;
