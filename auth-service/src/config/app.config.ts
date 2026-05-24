import { authServiceEnv } from './env.validation';

export const AppConfig = {
  nodeEnv: authServiceEnv.NODE_ENV,
  port: authServiceEnv.AUTH_SERVICE_PORT,
  graphqlPlayground: authServiceEnv.GRAPHQL_PLAYGROUND,
} as const;
