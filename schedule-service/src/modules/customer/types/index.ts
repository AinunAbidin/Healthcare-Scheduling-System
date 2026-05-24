export interface CreateCustomerCommand {
  name: string;
  email: string;
}

export interface UpdateCustomerCommand {
  id: string;
  name?: string;
  email?: string;
}

export interface CustomerPaginationQuery {
  skip?: number;
  take?: number;
}

export interface CustomerPagination {
  skip: number;
  take: number;
}
