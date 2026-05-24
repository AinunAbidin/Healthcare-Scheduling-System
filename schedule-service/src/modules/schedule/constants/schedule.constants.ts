import { registerEnumType } from '@nestjs/graphql';
import type { ScheduleStatus } from 'src/infra';

export enum ScheduleStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

registerEnumType(ScheduleStatusEnum, {
  name: 'ScheduleStatus',
});

export const SCHEDULE_DEFAULT_PAGINATION_TAKE = 10;
export const SCHEDULE_MAX_PAGINATION_TAKE = 100;
export const SCHEDULE_MIN_INTERVAL_MINUTES = 30;

export const SCHEDULE_ERROR_MESSAGES = {
  customerNotFound: 'Customer not found',
  doctorNotFound: 'Doctor not found',
  scheduleConflict: 'Doctor already has a schedule within 30 minutes of the selected time',
  scheduleNotFound: 'Schedule not found',
} as const;

export function toScheduleStatus(value: ScheduleStatusEnum | undefined): ScheduleStatus | undefined {
  if (!value) {
    return undefined;
  }

  return value as ScheduleStatus;
}
