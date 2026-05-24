import { CustomerPagination } from '../types';

export const CUSTOMER_CACHE_KEY_PATTERNS = {
  list: 'customer:list:*',
} as const;

export function toCustomerListCacheKey(pagination: CustomerPagination): string {
  return `customer:list:skip=${pagination.skip}:take=${pagination.take}`;
}

export function toCustomerByIdCacheKey(id: string): string {
  return `customer:id:${id}`;
}
