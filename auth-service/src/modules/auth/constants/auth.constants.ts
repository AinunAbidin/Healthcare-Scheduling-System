export const AUTH_TOKEN_TYPE = 'Bearer';

export const AUTH_ERROR_MESSAGES = {
  emailAlreadyRegistered: 'Email is already registered',
  invalidCredentials: 'Invalid email or password',
  invalidToken: 'Invalid or expired token',
} as const;
