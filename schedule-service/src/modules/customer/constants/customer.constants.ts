export const CUSTOMER_DEFAULT_PAGINATION_TAKE = 10;
export const CUSTOMER_MAX_PAGINATION_TAKE = 100;

export const CUSTOMER_ERROR_MESSAGES = {
  customerNotFound: 'Customer not found',
  customerEmailAlreadyExists: 'Customer email already exists',
  updatePayloadIsEmpty: 'At least one field must be provided to update customer',
} as const;
