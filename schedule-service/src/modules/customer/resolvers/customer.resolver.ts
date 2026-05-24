import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common';
import {
  CreateCustomerInput,
  CustomerIdInput,
  CustomerListOutput,
  CustomerOutput,
  CustomerPaginationInput,
  UpdateCustomerInput,
} from '../dtos';
import { CustomerService } from '../services/customer.service';

@Resolver(() => CustomerOutput)
@UseGuards(AuthGuard)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Mutation(() => CustomerOutput)
  createCustomer(@Args('input') input: CreateCustomerInput): Promise<CustomerOutput> {
    return this.customerService.createCustomer({
      name: input.name,
      email: input.email,
    });
  }

  @Mutation(() => CustomerOutput)
  updateCustomer(@Args('input') input: UpdateCustomerInput): Promise<CustomerOutput> {
    return this.customerService.updateCustomer({
      id: input.id,
      name: input.name,
      email: input.email,
    });
  }

  @Query(() => CustomerListOutput)
  customers(
    @Args('input', { nullable: true }) input?: CustomerPaginationInput,
  ): Promise<CustomerListOutput> {
    return this.customerService.getCustomers({
      skip: input?.skip,
      take: input?.take,
    });
  }

  @Query(() => CustomerOutput)
  customer(@Args('input') input: CustomerIdInput): Promise<CustomerOutput> {
    return this.customerService.getCustomerById(input.id);
  }

  @Mutation(() => CustomerOutput)
  deleteCustomer(@Args('input') input: CustomerIdInput): Promise<CustomerOutput> {
    return this.customerService.deleteCustomer(input.id);
  }
}
