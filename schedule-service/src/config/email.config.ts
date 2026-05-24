import { scheduleServiceEnv } from './env.validation';

export const EmailConfig = {
  from: scheduleServiceEnv.EMAIL_FROM,
  host: scheduleServiceEnv.SMTP_HOST,
  port: scheduleServiceEnv.SMTP_PORT,
  user: scheduleServiceEnv.SMTP_USER,
  password: scheduleServiceEnv.SMTP_PASSWORD,
} as const;
