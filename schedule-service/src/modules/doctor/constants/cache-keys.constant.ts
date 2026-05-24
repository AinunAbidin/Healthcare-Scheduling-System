import { DoctorPagination } from '../types';

export const DOCTOR_CACHE_KEY_PATTERNS = {
  list: 'doctor:list:*',
} as const;

export function toDoctorListCacheKey(pagination: DoctorPagination): string {
  return `doctor:list:skip=${pagination.skip}:take=${pagination.take}`;
}

export function toDoctorByIdCacheKey(id: string): string {
  return `doctor:id:${id}`;
}
