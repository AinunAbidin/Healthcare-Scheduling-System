import { scheduleServiceEnv } from './env.validation';

export const AppConfig = {
  nodeEnv: scheduleServiceEnv.NODE_ENV,
  port: scheduleServiceEnv.SCHEDULE_SERVICE_PORT,
  graphqlPlayground: scheduleServiceEnv.GRAPHQL_PLAYGROUND,
} as const;
