import { ScheduleListQuery, SchedulePagination } from '../types';

export const SCHEDULE_CACHE_KEY_PATTERNS = {
  list: 'schedule:list:*',
} as const;

export function toScheduleListCacheKey(
  query: ScheduleListQuery,
  pagination: SchedulePagination,
): string {
  const from = query.fromScheduledAt ? query.fromScheduledAt.toISOString() : '';
  const to = query.toScheduledAt ? query.toScheduledAt.toISOString() : '';

  return [
    'schedule:list',
    `customerId=${query.customerId ?? ''}`,
    `doctorId=${query.doctorId ?? ''}`,
    `status=${query.status ?? ''}`,
    `fromScheduledAt=${from}`,
    `toScheduledAt=${to}`,
    `skip=${pagination.skip}`,
    `take=${pagination.take}`,
  ].join(':');
}

export function toScheduleByIdCacheKey(id: string): string {
  return `schedule:id:${id}`;
}
