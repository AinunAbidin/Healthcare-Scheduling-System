import { authServiceEnv } from './env.validation';

export const JwtConfig = {
  secret: authServiceEnv.JWT_SECRET,
  expiresIn: authServiceEnv.JWT_EXPIRES_IN,
} as const;
