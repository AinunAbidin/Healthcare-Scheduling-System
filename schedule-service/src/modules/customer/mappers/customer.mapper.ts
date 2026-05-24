import { DatabaseCustomer } from 'src/infra';
import { CustomerListOutput, CustomerOutput } from '../dtos';

export class CustomerMapper {
  static toCustomerOutput(customer: DatabaseCustomer): CustomerOutput {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  static toCustomerListOutput(
    items: DatabaseCustomer[],
    total: number,
    skip: number,
    take: number,
  ): CustomerListOutput {
    return {
      items: items.map((item) => this.toCustomerOutput(item)),
      total,
      skip,
      take,
    };
  }
}
