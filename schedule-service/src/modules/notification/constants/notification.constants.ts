export const NOTIFICATION_QUEUE_NAMES = {
  email: 'email-notifications',
} as const;

export const EMAIL_NOTIFICATION_JOB_NAMES = {
  scheduleCreated: 'SEND_SCHEDULE_CREATED_EMAIL',
  scheduleCompleted: 'SEND_SCHEDULE_COMPLETED_EMAIL',
  scheduleDeleted: 'SEND_SCHEDULE_DELETED_EMAIL',
} as const;

export const EMAIL_NOTIFICATION_RETRY_OPTIONS = {
  attempts: 3,
  backoffType: 'exponential',
  backoffDelayMs: 3000,
  removeOnComplete: 100,
  removeOnFail: 500,
} as const;

export const EMAIL_NOTIFICATION_SUBJECTS = {
  scheduleCreated: 'Your Schedule Has Been Created',
  scheduleCompleted: 'Your Consultation Has Been Completed',
  scheduleDeleted: 'Your Schedule Has Been Canceled',
} as const;
