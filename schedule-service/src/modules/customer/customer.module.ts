import { Module } from '@nestjs/common';
import { CustomerResolver } from './resolvers/customer.resolver';
import { CustomerService } from './services/customer.service';

@Module({
  providers: [CustomerResolver, CustomerService],
})
export class CustomerModule {}
